import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { PrismaServiceMongo } from '../prisma/prismaMongo.service';
import { ChatbotQueryService } from './chatbotQuery.service';
import axios from 'axios';
import { GetChatDto } from './dto/chatbot.dto';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

@Injectable()
export class ChatbotService {
  constructor(
    private readonly prismaPostgres: PrismaServicePostgres,
    private readonly prismaMongo: PrismaServiceMongo,
    private readonly queryService: ChatbotQueryService,
  ) {}

  /**
   * Maneja el mensaje del usuario, integrando con Grok para determinar consultas necesarias,
   * ejecutarlas y generar la respuesta final basada en data de una parcela específica.
   * @param userId ID del usuario (para historial de chat).
   * @param idParcela ID de la parcela (restringe todo a esta parcela por seguridad).
   * @param message Mensaje del usuario.
   * @returns Respuesta generada por Grok.
   */
  async handleChatMessage(
    userId: number,
    idParcela: number,
    message: string,
  ): Promise<string> {
    const parcela = await this.prismaPostgres.parcela.findUnique({
      where: { id_parcela: idParcela },
      select: { id_usuario: true },
    });
    if (!parcela || parcela.id_usuario !== userId) {
      throw new BadRequestException('Acceso denegado a esta parcela');
    }

    const historyDoc = await this.prismaMongo.chat_histories.findFirst({
      where: { userId, parcelaId: idParcela },
    });
    let historyMessages: ChatMessage[] = historyDoc
      ? historyDoc.messages.map((m) => ({
          role: m.role as ChatMessage['role'],
          content: m.content,
        }))
      : [];

    // Contexto de tablas
    const dbSchemaContext = `
Solo puedes consultar información relacionada con la parcela cuyo ID es ${idParcela}. No solicites datos de otras parcelas, cultivos, usuarios o entidades ajenas.

Base de Datos SQL (PostgreSQL):
Tablas disponibles:
- parcela: id_parcela, nombre, descripcion, largo, ancho, latitud, longitud, status, id_cultivo.
- cultivo: id_cultivo, nombre, tipo, status.
- iot: id_iot, descripcion, token, status, ultima_conexion, id_parcela.
- sensor: id_sensor, nombre, unidad_medicion, modelo, status, id_category.
- sensor_category: id_category, name, description, unit, status.
- sensor_iot: id_sensor_iot, id_sensor, id_iot, status.

Base de Datos NoSQL (MongoDB):
Colecciones disponibles:
- parcela_data: id_parcela, iotReadings (id_iot, hora, image_url, image_result, sensorReadings[], overall_status).
- cultivo_params: id_cultivo, params (category_id, category_name, unidad_medicion, min, max, optimal, warning_threshold, description).

Consultas permitidas (elige un ID y sus parámetros; siempre opera sobre idParcela):
1: Obtener info básica de la parcela (params: ninguno).
2: Obtener info del cultivo asociado (params: ninguno).
3: Obtener parámetros óptimos del cultivo (params: ninguno).
4: Obtener lista de IoTs (params: ninguno).
5: Obtener lecturas recientes (params: {limit: number = 5}).
6: Obtener lecturas por IoT (params: {idIot: number}).
7: Obtener resumen de statuses (params: {limit: number = 10}).
8: Obtener lecturas por sensor (params: {idSensor: number}).
9: Obtener promedios por sensor (params: {idSensor: number, limit: number = 10}).
10: Obtener lista de sensores (params: ninguno).
11: Obtener categorías de sensores (params: ninguno).
12: Obtener imágenes recientes (params: {limit: number = 5}).
13: Obtener análisis de desviación por sensor (params: {idSensor: number, limit: number = 10}).
14: Obtener conteo global de statuses (params: ninguno).
15: Obtener lecturas filtradas por status (params: {targetStatus: string}).

Reglas:
- Nunca pidas datos fuera de la parcela ${idParcela}.
- Responde solo usando los IDs de consulta válidos.
- Si el usuario pide algo fuera del alcance, responde que no está permitido por las restricciones del sistema.
    `;

    // Primer prompt: Envía contexto + historial + mensaje del usuario
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `
Eres KORI, un asistente agrícola especializado en interpretar información de la parcela ${idParcela}. Tu misión es ayudar de forma clara, útil y profesional, manteniendo un tono amable y cercano, pero siempre dentro del ámbito agrícola.

Reglas estrictas:
1. Solo puedes basar tus respuestas en los datos entregados por el sistema mediante consultas.
2. No inventes información adicional ni hagas suposiciones no basadas en datos.
3. No menciones tablas reales, estructuras técnicas, modelos internos, consultas, herramientas, APIs, programación, código o procesos internos del sistema.
4. Mantén un enfoque agrícola práctico: cultivo, suelo, clima, sensores, salud vegetal, manejo del entorno y funcionamiento general de la parcela.
5. No proporciones información personal del usuario ni supongas datos externos no proporcionados por el sistema.
6. Nunca te alejes del contexto de la parcela ${idParcela}.

Comportamiento esperado:
- Si la pregunta del usuario es sencilla (por ejemplo: “¿Qué cultivo tiene la parcela?”), responde de manera breve, directa y cordial.
- Si la pregunta requiere análisis (por ejemplo: “¿Cómo está el cultivo?” o “¿Qué recomiendas según las lecturas?”), entonces entrega un análisis más completo y profundo.
- Si el usuario solicita información fuera del alcance permitido, responde indicando que no puedes acceder a esos datos por las restricciones del sistema.

Formato flexible:
No estás obligado a usar una estructura rígida. Adapta tu respuesta según lo que el usuario pregunte.

Cuando la consulta sea analítica, incluye de forma clara:
- Contexto general o estado del cultivo.
- Interpretación de los datos proporcionados.
- Señales de riesgo o aspectos importantes a vigilar.
- Recomendaciones prácticas de manejo basadas en los datos.

Tono:
- Profesional pero amable.
- Claro y directo.
- Útil, práctico y orientado al manejo real del cultivo.
- Evita textos innecesariamente extensos si la pregunta no lo requiere.

Tu nombre es KORI. Tu único objetivo es ayudar al usuario a entender y manejar la parcela ${idParcela} de la mejor manera posible usando únicamente los datos proporcionados por el sistema.

Información contextual autorizada:
${dbSchemaContext}        
`,
      },
      ...historyMessages,
      { role: 'user', content: message },
    ];

    // Definir tools para que Grok seleccione consultas
    const tools = [
      {
        type: 'function',
        function: {
          name: 'select_queries',
          description:
            'Selecciona arreglo de IDs de consultas necesarias y params (siempre incluye idParcela implícito)',
          parameters: {
            type: 'object',
            properties: {
              queries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer',
                      description: 'ID de la consulta (1-15)',
                    },
                    params: {
                      type: 'object',
                      additionalProperties: true,
                      description:
                        'Parámetros específicos (e.g., {idIot: 1, limit: 5})',
                    },
                  },
                  required: ['id'],
                },
              },
            },
            required: ['queries'],
          },
        },
      },
    ];

    // Primera llamada a Grok
    const response1 = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        messages,
        model: 'grok-3-mini',
        tools,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    let reply = response1.data.choices[0].message.content || '';

    // Si Grok llama al tool
    if (response1.data.choices[0].message.tool_calls) {
      const toolCall = response1.data.choices[0].message.tool_calls[0];
      if (toolCall.function.name === 'select_queries') {
        const args = JSON.parse(toolCall.function.arguments);
        const queryResults: Record<number, any> = {};

        // Ejecutar consultas seleccionadas
        for (const q of args.queries) {
          const result = await this.executeQuery(
            q.id,
            idParcela,
            q.params || {},
          );
          if (result) {
            queryResults[q.id] = result;
          }
        }

        // Segundo prompt: Envía resultados + historial original + mensaje
        const resultsContext = `Resultados de consultas: ${JSON.stringify(queryResults)}. Usa esto para generar la respuesta final.`;
        messages.push(response1.data.choices[0].message, {
          role: 'tool',
          content: resultsContext,
          tool_call_id: toolCall.id,
        });

        const response2 = await axios.post(
          'https://api.x.ai/v1/chat/completions',
          {
            messages,
            model: 'grok-4-fast-reasoning',
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.XAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        reply = response2.data.choices[0].message.content;
      }
    }

    const newMessages = [
      ...historyMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: reply },
    ];
    await this.prismaMongo.chat_histories.upsert({
      where: { userId_parcelaId: { userId, parcelaId: idParcela } },
      update: {
        messages: newMessages.map((m) => ({ ...m, timestamp: new Date() })),
      },
      create: {
        userId,
        parcelaId: idParcela,
        messages: newMessages.map((m) => ({ ...m, timestamp: new Date() })),
      },
    });

    return reply;
  }

  /**
   * Ejecuta la consulta basada en ID, siempre con idParcela fijo.
   * @param queryId ID de la consulta (1-15).
   * @param idParcela ID fijo de la parcela.
   * @param params Parámetros adicionales.
   */
  private async executeQuery(
    queryId: number,
    idParcela: number,
    params: any,
  ): Promise<any> {
    switch (queryId) {
      case 1:
        return this.queryService.getBasicParcelaInfo(idParcela);
      case 2:
        return this.queryService.getCultivoInfo(idParcela);
      case 3:
        return this.queryService.getCultivoParams(idParcela);
      case 4:
        return this.queryService.getIotsForParcela(idParcela);
      case 5:
        return this.queryService.getRecentReadings(idParcela, params.limit);
      case 6:
        return this.queryService.getReadingsByIot(idParcela, params.idIot);
      case 7:
        return this.queryService.getStatusSummary(idParcela, params.limit);
      case 8:
        return this.queryService.getReadingsBySensor(
          idParcela,
          params.idSensor,
        );
      case 9:
        return this.queryService.getAverageReadingsBySensor(
          idParcela,
          params.idSensor,
          params.limit,
        );
      case 10:
        return this.queryService.getSensorsForParcela(idParcela);
      case 11:
        return this.queryService.getSensorCategoriesForParcela(idParcela);
      case 12:
        return this.queryService.getRecentImages(idParcela, params.limit);
      case 13:
        return this.queryService.getDeviationAnalysis(
          idParcela,
          params.idSensor,
          params.limit,
        );
      case 14:
        return this.queryService.getGlobalStatusCount(idParcela);
      case 15:
        return this.queryService.getReadingsByStatus(
          idParcela,
          params.targetStatus,
        );
      default:
        return null;
    }
  }

  async getChat(dto: GetChatDto, userId: number) {
    const { idParcel } = dto;
    const historyDoc = await this.prismaMongo.chat_histories.findFirst({
      where: { userId, parcelaId: idParcel },
    });
    return historyDoc
  }
}
