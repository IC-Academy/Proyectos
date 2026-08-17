# Ajustes aplicados — FOR-CAP-003 Rev. 4

Base visual: `evaluacion-desempeno-mkt-imagenes.zip`.

## Implementado
- Ponderación oficial 40% Valores y Actitud / 30% Técnica / 30% Objetivos.
- 5 reactivos oficiales de Valores y Actitud (8% cada uno).
- 5 reactivos oficiales de Conocimientos y Habilidades Técnicas (6% cada uno).
- Cuadro de apoyo visible para B.2 con herramientas y sistemas de uso general.
- Se elimina del flujo visible la separación antigua Habilidades / Conocimientos.
- Objetivos del periodo sin validación SMART obligatoria.
- Captura: Objetivo, Meta/Indicador, Resultado obtenido, % de cumplimiento, Calificación 1-5/N/A.
- Conversión automática de % de cumplimiento: >=110=5, 100-109=4, 90-99=3, 75-89=2, <75=1.
- Objetivos no cuantificables pueden calificarse manualmente con evidencia.
- N/A excluido de promedios; si más de la mitad de una sección queda N/A se exige justificación antes de enviar.
- Ejes 9-box alineados: ACTITUD desde A; DESEMPEÑO desde Técnica + Objetivos.
- Radar y textos de 9-box actualizados a las 3 secciones Rev.4.
- Confirmación final ampliada visualmente.
- SMART/IA conservado solo como compatibilidad futura, fuera del flujo visible actual.
- Login OTP conservado sin cambios; Entra ID/SAML queda para la siguiente fase.

## Nota técnica
La clave interna `habilidades` se reutiliza para representar el bloque oficial B (Conocimientos y Habilidades Técnicas). La clave interna histórica `conocimientos` queda con peso 0 y fuera del wizard para mantener compatibilidad con datos/funciones existentes sin una migración destructiva.

- UX solicitado 2026-08-13: escala permanente en estrellas en barra lateral, calificaciones alineadas en posición fija, guía de objetivos horizontal con confirmación obligatoria antes de habilitar captura; aplicado también al flujo del líder.
