/**
 * app.js
 * ---------------------------------------------------------------------------
 * Interfaz y navegación de la demo EDD Inter-Con. Router por hash, tres
 * portales (Colaborador / Líder / Administrador) y componentes compartidos.
 *
 * Beta 3: la sesión (login por número de empleado + código temporal) ya NO
 * se maneja aquí — vive en auth.js (EDDAuth), sobre sessionStorage. Este
 * archivo solo consume EDDAuth.getSession()/getAppUser() para saber quién
 * es el usuario en turno, igual que ya consumía EDDStorage para los datos.
 * ---------------------------------------------------------------------------
 */

(function (global) {
  'use strict';
  const D = global.EDDData;
  const C = global.EDDCalc;
  const S = global.EDDStorage;
  const A = global.EDDAuth;



  // =========================================================================
  // IDIOMA ES / EN — traducción de interfaz sin alterar datos ni lógica.
  // Se guarda localmente para que el usuario conserve su preferencia.
  // =========================================================================
  const LANG_KEY = 'edd_language';
  let currentLang = localStorage.getItem(LANG_KEY) || 'es';

  const EN = {
    'Inicio':'Home','Autoevaluación':'Self-assessment','Retroalimentación':'Feedback',
    'Mi equipo':'My team','Pendientes por evaluar':'Pending evaluations','Dashboard':'Dashboard',
    'Calibración':'Calibration','Matriz 9-Box':'9-Box Matrix','Usuarios':'Users','Jerarquías':'Hierarchy',
    'Auditoría':'Audit','Configuración':'Settings','Cerrar sesión':'Sign out',
    'Plataforma corporativa':'Corporate platform','Bienvenido(a)':'Welcome','Verificación de identidad':'Identity verification',
    'Utiliza tu número de empleado para acceder a tu evaluación.':'Use your employee number to access your evaluation.',
    'Revisa tu correo corporativo y captura el código temporal de 6 dígitos.':'Check your corporate email and enter the 6-digit temporary code.',
    'Acceso protegido · Uso exclusivo de personal autorizado':'Protected access · Authorized personnel only',
    'Número de empleado':'Employee number','Ingresa tu número de empleado':'Enter your employee number',
    'Continuar':'Continue','Enviando…':'Sending…','Código temporal':'Temporary code',
    'Ingresar a la plataforma':'Enter platform','Validando…':'Validating…',
    'El código vence en':'The code expires in','minutos.':'minutes.','vencido':'expired',
    'Evaluación de Desempeño Administrativo':'Administrative Performance Evaluation',
    'Duración estimada':'Estimated duration','¿Quién participa?':'Who participates?','Antes de comenzar':'Before you begin',
    'Confidencialidad':'Confidentiality','¿Cómo se integra?':'How is it structured?','Escala de evaluación':'Rating scale',
    'Comenzar mi evaluación':'Start my evaluation','Tu autoevaluación.':'Your self-assessment.',
    'La evaluación de tu líder.':'Your manager’s evaluation.','Retroalimentación para tu desarrollo.':'Feedback for your development.',
    'Valores y Actitud':'Values and Attitude','Habilidades':'Skills','Conocimientos':'Knowledge','Objetivos':'Objectives',
    'Cumplimiento de Objetivos':'Goal Achievement','Guardar progreso':'Save progress','Siguiente':'Next','Anterior':'Back',
    'Siguiente sección':'Next section','Finalizar y enviar ✓':'Finish and submit ✓','Progreso general':'Overall progress',
    'Progreso de la sección':'Section progress','Recordatorio':'Reminder','Puedes guardar tu progreso en cualquier momento.':'You can save your progress at any time.',
    'Tu evaluación es confidencial.':'Your evaluation is confidential.','Comentarios (opcional)':'Comments (optional)',
    'Resumen de tu evaluación':'Evaluation summary','Revisa tus resultados antes de finalizar.':'Review your results before finishing.',
    'Puntaje global':'Overall score','Nivel global':'Overall level','Interpretación de nivel':'Level interpretation',
    'Finalizar y enviar mi evaluación':'Finish and submit my evaluation','¡Evaluación enviada con éxito!':'Evaluation submitted successfully!',
    'Gracias por tu participación.':'Thank you for your participation.','Ir al inicio':'Go to home',
    'Tu autoevaluación ha sido enviada correctamente.':'Your self-assessment was submitted successfully.',
    'Tu líder recibirá una notificación para realizar su evaluación.':'Your manager will receive a notification to complete their evaluation.',
    'Pendientes de retroalimentación':'Pending feedback','Nombre':'Name','Puesto':'Position','Área':'Area',
    'Evaluación líder':'Manager evaluation','Comparación':'Comparison','Evaluar':'Evaluate','Ver':'View',
    'No tienes evaluaciones pendientes en este momento.':'You have no pending evaluations at this time.',
    'Guardar calibración':'Save calibration','Habilitar retroalimentación':'Enable feedback','Retroalimentación habilitada':'Feedback enabled',
    'Resultado calibrado':'Calibrated result','Autoevaluación':'Self-assessment','Percepción del colaborador':'Employee self-perception',
    'Resultado líder':'Manager result','Resultado final':'Final result','Justificación':'Justification',
    'Fortalezas':'Strengths','Áreas de oportunidad':'Development opportunities','Plan de desarrollo':'Development plan',
    'Competencia a desarrollar':'Competency to develop','Acción':'Action','Responsable':'Owner','Fecha compromiso':'Due date',
    'Objetivo específico':'Specific objective','Meta / indicador':'Target / indicator','Resultado obtenido':'Result achieved','Calificación':'Rating',
    'Validación SMART':'SMART validation','Específico':'Specific','Medible':'Measurable','Alcanzable':'Achievable','Relevante':'Relevant','Temporal':'Time-bound',
    'Completa los criterios pendientes antes de continuar.':'Complete the pending criteria before continuing.',
    '¿Qué es un objetivo SMART?':'What is a SMART objective?','Guía SMART':'SMART guide','Ejemplo':'Example',
    'Objetivo general:':'General objective:','Objetivo SMART:':'SMART objective:','¿Por qué es SMART?':'Why is it SMART?',
    'Quitar':'Remove','Agregar objetivo':'Add objective','Ver escala de evaluación':'View rating scale',
    'Excede significativamente las expectativas. Es un referente para otros.':'Significantly exceeds expectations. Serves as a role model for others.',
    'Supera las expectativas de manera constante.':'Consistently exceeds expectations.',
    'Cumple con lo esperado para su puesto.':'Meets expectations for the role.',
    'Cumple parcialmente; requiere mejorar.':'Partially meets expectations; improvement is required.',
    'No cumple con las expectativas del puesto.':'Does not meet the expectations of the role.',
    'No aplica o no cuento con elementos suficientes para evaluarlo.':'Not applicable or insufficient information to evaluate.',
    'Sobresaliente':'Outstanding','Excede las expectativas':'Exceeds expectations','Cumple las expectativas':'Meets expectations',
    'Cumple parcialmente; requiere plan de mejora':'Partially meets expectations; improvement plan required',
    'No cumple las expectativas del puesto':'Does not meet role expectations','Alto':'High','Medio':'Medium','Bajo':'Low',
    'Activo':'Active','Inactivo':'Inactive','Completada':'Completed','En progreso':'In progress','No iniciada':'Not started',
    'Pendiente de líder':'Pending manager','Pendiente de calibración':'Pending calibration','Calibrada':'Calibrated',
    'Retroalimentación pendiente':'Feedback pending','Cerrada':'Closed','Vencida':'Overdue',
    'Buscar':'Search','Limpiar filtros':'Clear filters','Todos':'All','Todas':'All','Estado':'Status','Periodo':'Period',
    'Guardar':'Save','Cancelar':'Cancel','Aceptar':'Accept','Cerrar':'Close','Sí':'Yes','No':'No'
  };

  Object.assign(EN, {"Inicia sesión": "Sign in", "Ingresa tu código de acceso": "Enter your access code", "Una experiencia simple, segura y confidencial para impulsar tu desarrollo dentro de Inter-Con.": "A simple, secure and confidential experience designed to support your growth at Inter-Con.", "Seguro": "Secure", "Tus datos están protegidos": "Your data is protected", "Confidencial": "Confidential", "Información de uso interno": "Internal-use information", "Desarrollo": "Growth", "Impulsamos tu crecimiento": "We support your growth", "Te enviaremos un código de verificación a tu correo corporativo.": "We will send a verification code to your corporate email.", "Accesos de demostración": "Demo access", "Colaborador": "Employee", "Líder": "Manager", "Administrador": "Administrator", "Tu sesión anterior expiró por inactividad. Inicia sesión de nuevo.": "Your previous session expired due to inactivity. Please sign in again.", "Demo funcional EDD Inter-Con — FOR-CAP-003 Rev. 4 · Datos simulados almacenados localmente en este navegador.": "Functional EDD Inter-Con demo — FOR-CAP-003 Rev. 4 · Simulated data stored locally in this browser.", "¡Bienvenida, Laura!": "Welcome, Laura!", "¡Bienvenido, Laura!": "Welcome, Laura!", "Esta evaluación nos ayuda a conocer tu desempeño, reconocer tus fortalezas e identificar oportunidades de desarrollo que impulsen tu crecimiento dentro de Inter-Con.": "This evaluation helps us understand your performance, recognize your strengths, and identify development opportunities that support your growth at Inter-Con.", "15 a 20 minutos": "15 to 20 minutes", "Procura realizar la evaluación en un solo momento y sin interrupciones.": "Try to complete the evaluation in one sitting and without interruptions.", "Responde con honestidad y objetividad.": "Answer honestly and objectively.", "Considera tu desempeño durante el periodo evaluado.": "Consider your performance throughout the evaluation period.", "Lee cuidadosamente cada pregunta.": "Read each question carefully.", "Tus respuestas serán tratadas de forma confidencial y se utilizarán exclusivamente para apoyar tu desarrollo y fortalecer nuestro proceso de gestión del desempeño.": "Your responses will be treated confidentially and used exclusively to support your development and strengthen our performance management process.", "Valores y Actitud 40% + Técnica Funcional 60%": "Values and Attitude 50% + Technical-functional Skills and Objectives 50%", "Tu opinión y compromiso contribuyen a construir un mejor Inter-Con.": "Your feedback and commitment help build a better Inter-Con.", "Tu evaluación ya fue enviada": "Your evaluation has already been submitted", "Gracias por tu participación, Laura.": "Thank you for your participation, Laura.", "Tu autoevaluación ha sido registrada correctamente.": "Your self-assessment has been recorded successfully.", "Tu líder recibirá la notificación correspondiente para continuar con el proceso.": "Your manager will receive the appropriate notification to continue the process.", "Tu compromiso impulsa tu desarrollo y el éxito de Inter-Con.": "Your commitment supports your growth and Inter-Con’s success.", "Personal a evaluar": "Employees to evaluate", "Universo del periodo": "Employees in this cycle", "Autoevaluaciones": "Self-assessments", "completadas": "completed", "Evaluaciones líder": "Manager evaluations", "Por calibrar": "Pending calibration", "Requieren revisión RH": "Require HR review", "Calibradas": "Calibrated", "Con resultado RH": "With HR result", "Promedio general": "Overall average", "Resultado disponible": "Result available", "Avance del ciclo": "Cycle progress", "evaluaciones cerradas": "evaluations closed", "PANEL RH": "HR PANEL", "Seguimiento nacional, calibración, cierre y distribución de talento en un solo lugar.": "National tracking, calibration, closure, and talent distribution in one place.", "COBERTURA": "COVERAGE", "Avance por área": "Progress by area", "Cierre del proceso": "Process close", "RESULTADOS": "RESULTS", "Niveles de desempeño": "Performance levels", "TALENTO": "TALENT", "Distribución 9-Box": "9-Box distribution", "Abrir matriz": "Open matrix", "OPERACIÓN RH": "HR OPERATIONS", "Seguimiento de evaluaciones": "Evaluation tracking", "Todas las áreas": "All areas", "Todos los estados": "All statuses", "Todos los cuadrantes": "All quadrants", "Limpiar": "Clear", "COLABORADOR": "EMPLOYEE", "AREA": "AREA", "LÍDER": "MANAGER", "STATUS": "STATUS", "PUNTAJE": "SCORE", "9-BOX": "9-BOX", "Recursos Humanos": "Human Resources", "Finanzas": "Finance", "Operaciones": "Operations", "Tecnología": "Technology", "Comercial": "Commercial", "Analista de Recursos Humanos": "Human Resources Analyst", "Gerente de Recursos Humanos": "Human Resources Manager", "Coordinador de Nómina": "Payroll Coordinator", "Pendiente líder": "Pending manager", "Pendiente manager": "Pending manager", "Cerrada": "Closed", "Cuadrante": "Quadrant", "A. Valores y Actitud": "A. Values and Attitude", "B. Habilidades": "B. Skills", "C. Conocimientos": "C. Knowledge", "D. Cumplimiento de Objetivos": "D. Goal Achievement", "ACTITUD": "ATTITUDE", "DESEMPEÑO": "PERFORMANCE", "Evalúa la vivencia diaria de los valores ESPÍRITU de Inter-Con. Esta sección determina la posición del colaborador en el eje vertical (Actitud) de la matriz 9-box.": "Evaluates how consistently Inter-Con’s ESPÍRITU values are demonstrated in daily work. This section determines the employee’s position on the vertical Attitude axis of the 9-box matrix.", "Evalúa las capacidades funcionales para ejecutar el puesto con eficiencia.": "Evaluates the functional capabilities required to perform the role efficiently.", "Evalúa el dominio técnico del puesto y de los procesos/herramientas del área.": "Evaluates technical mastery of the role and the area’s processes and tools.", "Se evalúa de forma independiente al bloque de competencias. Registra hasta cinco objetivos acordados al inicio del periodo, su meta o indicador, resultado alcanzado y calificación.": "Evaluated independently from the competency block. Enter up to five objectives agreed at the start of the period, including target or indicator, achieved result, and rating.", "Compromiso Organizacional (Integridad y Excelencia)": "Organizational Commitment (Integrity and Excellence)", "Actitud de Servicio (Pasión y Respeto)": "Service Mindset (Passion and Respect)", "Trabajo en Equipo y Unión": "Teamwork and Unity", "Innovación y Creatividad (Capacidad de Cambio y Flexibilidad)": "Innovation and Creativity (Change Agility and Flexibility)", "Compromiso con la Sustentabilidad": "Commitment to Sustainability", "Orientación a Resultados": "Results Orientation", "Planeación y Organización": "Planning and Organization", "Comunicación Efectiva": "Effective Communication", "Seguimiento y Control": "Follow-up and Control", "Desarrollo de Personas (Liderazgo)": "People Development (Leadership)", "Dominio del Puesto": "Role Mastery", "Procesos y Herramientas de Trabajo": "Work Processes and Tools", "Actúa conforme a los valores ESPÍRITU de Inter-Con.": "Acts in accordance with Inter-Con’s ESPÍRITU values.", "Muestra responsabilidad y ética profesional.": "Demonstrates responsibility and professional ethics.", "Se involucra activamente en los objetivos de la empresa.": "Actively contributes to company objectives.", "Atiende oportunamente las solicitudes de clientes internos y externos.": "Responds promptly to internal and external customer requests.", "Demuestra disposición y pasión para apoyar a otros.": "Shows willingness and passion for supporting others.", "Actúa con profesionalismo, respeto y empatía.": "Acts with professionalism, respect, and empathy.", "Colabora con otras áreas para lograr objetivos comunes.": "Collaborates across areas to achieve shared objectives.", "Mantiene relaciones laborales basadas en el respeto.": "Maintains respectful working relationships.", "Contribuye a resolver diferencias de manera constructiva.": "Helps resolve differences constructively.", "Se adapta positivamente a cambios y nuevas prioridades.": "Adapts positively to change and new priorities.", "Propone ideas para mejorar procesos.": "Proposes ideas to improve processes.", "Implementa soluciones innovadoras cuando es necesario.": "Implements innovative solutions when needed.", "Hace uso responsable de los recursos materiales y energéticos a su cargo.": "Uses assigned material and energy resources responsibly.", "Promueve prácticas de cuidado ambiental y ahorro de recursos en su área de trabajo.": "Promotes environmental care and resource-saving practices in the workplace.", "Cumple consistentemente los objetivos establecidos.": "Consistently meets established objectives.", "Mantiene altos estándares de calidad en su trabajo.": "Maintains high quality standards in their work.", "Propone acciones para mejorar la productividad y eficiencia.": "Proposes actions to improve productivity and efficiency.", "Organiza adecuadamente sus actividades y prioridades.": "Organizes activities and priorities effectively.", "Cumple los plazos establecidos.": "Meets established deadlines.", "Anticipa riesgos y establece acciones preventivas.": "Anticipates risks and establishes preventive actions.", "Se comunica de forma clara, respetuosa y oportuna.": "Communicates clearly, respectfully, and promptly.", "Escucha activamente y considera diferentes puntos de vista.": "Listens actively and considers different points of view.", "Comparte información relevante para facilitar el trabajo.": "Shares relevant information to facilitate work.", "Da seguimiento oportuno a sus actividades.": "Follows up on activities in a timely manner.", "Cumple políticas y procedimientos internos.": "Complies with internal policies and procedures.", "Administra adecuadamente los recursos asignados.": "Manages assigned resources appropriately.", "Comparte conocimientos con sus compañeros.": "Shares knowledge with colleagues.", "Brinda apoyo cuando otros lo requieren.": "Provides support when others need it.", "Favorece un ambiente de aprendizaje y colaboración.": "Fosters a learning and collaborative environment.", "Aplica correctamente los conocimientos de su puesto.": "Correctly applies role-specific knowledge.", "Resuelve problemas relacionados con sus funciones.": "Solves problems related to their responsibilities.", "Mantiene actualizados sus conocimientos.": "Keeps their knowledge up to date.", "Conoce y aplica correctamente los procesos, políticas y procedimientos de su área.": "Understands and correctly applies the area’s processes, policies, and procedures.", "Utiliza adecuadamente las herramientas y sistemas de automatización disponibles para su puesto.": "Uses the tools and automation systems available for the role appropriately.", "Actas administrativas": "Administrative actions", "Indicador / referencia NOM-035": "NOM-035 indicator / reference", "Sin dato": "No data", "Estos datos son contextuales. En esta demo no generan un descuento automático sobre la calificación.": "These data are contextual. In this demo they do not automatically reduce the score.", "Observaciones de RH": "HR observations", "Registra hechos, contexto o acuerdos relevantes...": "Record relevant facts, context, or agreements...", "DECISIÓN": "DECISION", "Ajuste de calibración": "Calibration adjustment", "Ajuste en puntos": "Point adjustment", "Justificación obligatoria cuando exista ajuste": "Justification required when an adjustment exists", "Explica la razón del ajuste y la evidencia utilizada...": "Explain the reason for the adjustment and the evidence used...", "Trazabilidad de cambios": "Change history", "movimientos": "changes", "Campo": "Field", "Anterior": "Previous", "Nuevo": "New", "Motivo": "Reason", "Usuario": "User", "Fecha": "Date", "Hora": "Time", "Sin cambios registrados.": "No changes recorded."});

  Object.assign(EN, {
    'Sección':'Section','Evaluación del líder':'Manager evaluation','Líder':'Manager','Calibrado':'Calibrated','Calibrado*':'Calibrated*',
    'Puntaje de desempeño':'Performance score','Potencial preliminar':'Preliminary potential','Quitar selección individual':'Clear individual selection',
    'Haz clic en un cuadrante para ver su significado y acción sugerida, o en el marcador de un colaborador para ver su detalle individual.':'Click a quadrant to view its meaning and suggested action, or click an employee marker to view individual details.',
    'Colaboradores en este cuadrante':'Employees in this quadrant','Sin colaboradores.':'No employees.','Ubicación 9-Box':'9-Box placement',
    'Criterio oficial Rev4 para ambos ejes: Bajo <60, Medio / esperado 60–79, Alto 80–100 (base 100).':'Official Rev4 criteria for both axes: Low <60, Medium / expected 60–79, High 80–100 (base 100).',
    'Auditoría':'Audit','Valor anterior':'Previous value','Valor nuevo':'New value','Configuración':'Settings','Umbrales de brecha (comparación auto vs. líder)':'Gap thresholds (self-assessment vs. manager)',
    'Reinicio de datos':'Data reset','Restaura todos los datos de la demo a su estado inicial (usuarios, evaluaciones, calibraciones, auditoría). Esta acción no se puede deshacer.':'Restores all demo data to its initial state (users, evaluations, calibrations, audit). This action cannot be undone.',
    'Reiniciar datos de la demo':'Reset demo data','Captura tu número de empleado.':'Enter your employee number.','Confirma que la información es correcta antes de enviar.':'Confirm that the information is correct before submitting.',
    'Registra al menos un objetivo antes de enviar.':'Enter at least one objective before submitting.','Confirma que la evaluación está completa antes de enviar.':'Confirm that the evaluation is complete before submitting.',
    'La justificación es obligatoria cuando existe un ajuste distinto de 0.':'Justification is required when there is a non-zero adjustment.','Calibración guardada.':'Calibration saved.',
    'Guarda la calibración antes de habilitar la retroalimentación.':'Save the calibration before enabling feedback.','El resultado es menor a 80. Registra al menos un plan de desarrollo antes de habilitar la retroalimentación.':'The result is below 80. Add at least one development plan before enabling feedback.',
    'Retroalimentación habilitada para el colaborador.':'Feedback enabled for the employee.','Error de conexión. Verifica tu internet e intenta de nuevo.':'Connection error. Check your internet connection and try again.',
    'La solicitud tardó demasiado. Intenta de nuevo.':'The request took too long. Try again.','El código venció. Solicita uno nuevo.':'The code expired. Request a new one.','Código inválido. Verifica los 6 dígitos e intenta de nuevo.':'Invalid code. Check the 6 digits and try again.',
    'Verifica los datos capturados.':'Check the information entered.','Tu sesión expiró. Inicia sesión nuevamente.':'Your session expired. Please sign in again.','Ocurrió un error inesperado. Intenta de nuevo.':'An unexpected error occurred. Try again.',
    'No puedes continuar. Tienes':'You cannot continue. You have','campo pendiente':'pending field','campos pendientes':'pending fields','Revisa lo marcado en rojo.':'Review the fields marked in red.',
    'Semilla':'Seed','Cosecha':'Harvest','Sembrando':'Sowing','Sol':'Sun','Corazón':'Heart','En Maceta':'Potted','Agua':'Water'
  });


  // Cobertura EN ampliada: textos compuestos, pantallas de líder/RH y etiquetas
  // que antes quedaban en español al renderizarse dinámicamente.
  Object.assign(EN, {
    'Escala de evaluación':'Rating scale',
    'Excede significativamente las expectativas.':'Significantly exceeds expectations.',
    'Supera las expectativas de manera constante.':'Consistently exceeds expectations.',
    'Cumple con lo esperado para su puesto.':'Meets expectations for the role.',
    'Cumple parcialmente; requiere mejorar.':'Partially meets expectations; improvement is required.',
    'No cumple con las expectativas del puesto.':'Does not meet role expectations.',
    'EJEMPLO':'EXAMPLE','General objective:':'General objective:','SMART objective:':'SMART objective:',
    'Quiero mejorar la capacitación de los colaboradores.':'I want to improve employee training.',
    'Incrementar del 75% al 90% el porcentaje de colaboradores que concluyen satisfactoriamente la capacitación de inducción, durante los próximos 3 meses, mediante seguimiento semanal, recordatorios y evaluación de conocimientos al finalizar el curso.':'Increase from 75% to 90% the percentage of employees who successfully complete induction training over the next 3 months, through weekly follow-up, reminders, and a knowledge assessment at the end of the course.',
    'S – Específico: Mejorar la conclusión satisfactoria de la capacitación.':'S – Specific: Improve successful completion of training.',
    'M – Medible: Pasar del 75% al 90%.':'M – Measurable: Increase from 75% to 90%.',
    'A – Alcanzable: Se establecen acciones concretas de seguimiento.':'A – Achievable: Concrete follow-up actions are established.',
    'R – Relevante: Fortalece la preparación de los colaboradores.':'R – Relevant: Strengthens employee preparedness.',
    'T – Temporal: Se debe lograr en 3 meses.':'T – Time-bound: It must be achieved within 3 months.',
    'CUMPLIMIENTO DE OBJETIVOS · 25% DEL TOTAL':'GOAL ACHIEVEMENT · 25% OF TOTAL',
    'Captura tus objetivos del periodo':'Enter your goals for the period',
    'Registra hasta cinco objetivos. Completa la meta, fecha y criterios SMART; solo se promedian los objetivos con descripción y calificación válida.':'Enter up to five goals. Complete the target, due date, and SMART criteria; only goals with a valid description and rating are averaged.',
    'criterios':'criteria','criterio':'criterion','Completa los criterios pendientes antes de continuar.':'Complete the pending criteria before continuing.',
    'Es alcanzable con los recursos y responsabilidades disponibles.':'It is achievable with the available resources and responsibilities.',
    'Está relacionado con las responsabilidades del puesto o prioridades del área.':'It is related to the role responsibilities or area priorities.',
    'Resultado obtenido':'Result achieved','Calificación':'Rating','Quitar':'Remove',
    'Confirmo que la información capturada es correcta.':'I confirm that the information entered is correct.',
    'Confirma que la información es correcta antes de enviar.':'Confirm that the information is correct before submitting.',
    'Evaluación de':'Evaluation of','N.º DE EMPLEADO':'EMPLOYEE NO.','N° DE EMPLEADO':'EMPLOYEE NO.','N.º de empleado':'Employee no.',
    'PUESTO':'POSITION','ÁREA':'AREA','DIRECCIÓN':'DEPARTMENT','CIUDAD OPERATIVA':'OPERATING CITY','ANTIGÜEDAD':'TENURE','PERIODO':'PERIOD',
    'Jefe directo':'Direct manager','MANAGER DIRECTO':'DIRECT MANAGER','Líder directo':'Direct manager','Antigüedad':'Tenure',
    'La autoevaluación del colaborador permanecerá oculta hasta que envíes tu evaluación.':'The employee self-assessment will remain hidden until you submit your evaluation.',
    'REVISIÓN FINAL':'FINAL REVIEW','Resumen y envío':'Summary and submission',
    'Registra retroalimentación cualitativa. Estos campos se mostrarán al colaborador cuando RH habilite la fase de retroalimentación.':'Enter qualitative feedback. These fields will be shown to the employee when HR enables the feedback phase.',
    'Fortalezas del colaborador':'Employee strengths','Comentarios generales':'General comments',
    'Áreas de oportunidad y plan de mejora':'Development opportunities and improvement plan',
    'Sin áreas registradas todavía.':'No development opportunities added yet.','+ Agregar área de oportunidad':'+ Add development opportunity',
    'Sin acciones registradas todavía.':'No development actions added yet.','+ Agregar acción de desarrollo':'+ Add development action',
    'Confirmo que la evaluación está completa.':'I confirm that the evaluation is complete.','Enviar evaluación ✓':'Submit evaluation ✓',
    'Diferencias detalladas por competencia':'Detailed differences by competency','COMPETENCIA':'COMPETENCY','AUTOEVALUACIÓN':'SELF-ASSESSMENT',
    'EVALUACIÓN LÍDER':'MANAGER EVALUATION','DIFERENCIA':'DIFFERENCE','BRECHA':'GAP','COMENTARIO LÍDER':'MANAGER COMMENT','COMENTARIO COLABORADOR':'EMPLOYEE COMMENT',
    'Brecha significativa':'Significant gap','Alineada':'Aligned','Revisar':'Review','En revisión':'Under review',
    'D. Cumplimiento de Objetivos (promedio)':'D. Goal Achievement (average)',
    'Ubicación en la 9-Box Matrix':'9-Box Matrix placement','Desempeño':'Performance','Actitud':'Attitude',
    'Cumple a satisfacción tanto en actitud como en desempeño.':'Meets expectations in both attitude and performance.',
    'Prioridad: Alta':'Priority: High','Prioridad: Media':'Priority: Medium','Prioridad: Baja':'Priority: Low',
    'Acción sugerida:':'Suggested action:','Seguimiento:':'Follow-up:','Promoción inmediata':'Immediate promotion',
    'estrella de Inter-Con, lista para promoción inmediata.':'Inter-Con star, ready for immediate promotion.',
    'Status actual del proceso:':'Current process status:','La calibración y liberación de retroalimentación las gestiona el administrador de RH.':'Calibration and feedback release are managed by the HR administrator.',
    'Pendiente calibración':'Pending calibration','Pendiente líder':'Pending manager','Pendiente manager':'Pending manager',
    'HR OPERATIONS':'HR OPERATIONS','Evaluation tracking':'Evaluation tracking','registros':'records','PUNTAJE':'SCORE','Puntaje':'Score','Revisar':'Review',
    'Todos los estados':'All statuses','Todos los cuadrantes':'All quadrants','Todas las áreas':'All areas','Limpiar':'Clear',
    'Resultados por sección':'Results by section','Puntaje final sobre 100':'Final score out of 100','promedio':'average','pts':'pts',
    'Radar comparativo':'Comparison radar','AUTOEVAL.':'SELF-ASSESS.','LÍDER':'MANAGER','CALIBRADO*':'CALIBRATED*',
    'La serie "Calibrado" es una proyección proporcional de la forma de la evaluación del líder (factor 1.00×), porque la calibración de RH ajusta el resultado global y no cada competencia.':'The “Calibrated” series is a proportional projection of the manager evaluation shape (factor 1.00×), because HR calibration adjusts the overall result rather than each competency.',
    '9-Box Matrix (tu ubicación)':'9-Box Matrix (your placement)','tu ubicación':'your placement','Medio / esperado':'Medium / expected',
    'Desempeño (esc. 1-5)':'Performance (scale 1-5)','Potencial preliminar (esc. 1-5)':'Preliminary potential (scale 1-5)',
    'Evaluación de Desempeño':'Performance Evaluation','Seguimiento nacional, calibración, cierre y distribución de talento en un solo lugar.':'National tracking, calibration, closure, and talent distribution in one place.',
    'Personal a evaluar':'Employees to evaluate','Autoevaluaciones':'Self-assessments','Evaluaciones líder':'Manager evaluations','Por calibrar':'Pending calibration','Calibradas':'Calibrated','Promedio general':'Overall average',
    'Avance del ciclo':'Cycle progress','evaluaciones cerradas':'evaluations closed','Universo del periodo':'Period population','completadas':'completed','Requieren revisión RH':'Require HR review','Con resultado RH':'With HR result','Resultado disponible':'Result available',
    'COBERTURA':'COVERAGE','Avance por área':'Progress by area','Cierre del proceso':'Process closure','colaboradores':'employees',
    'RESULTADOS':'RESULTS','Niveles de desempeño':'Performance levels','TALENTO':'TALENT','Distribución 9-Box':'9-Box distribution','Abrir matriz →':'Open matrix →',
    'OPERACIÓN RH':'HR OPERATIONS','Seguimiento de evaluaciones':'Evaluation tracking','PRIORIDAD':'PRIORITY','Áreas con mayor rezago':'Areas with greatest delay','ALERTAS':'ALERTS','Atención requerida':'Attention required',
    'autoevaluaciones vencidas':'overdue self-assessments','evaluaciones esperando calibración':'evaluations awaiting calibration',
    'CALIBRACIÓN RH':'HR CALIBRATION','Revisión y calibración':'Review and calibration','Contrasta autoevaluación, evaluación del líder y contexto del colaborador antes de liberar resultados.':'Compare the self-assessment, manager evaluation, and employee context before releasing results.',
    'EXPEDIENTE DE CALIBRACIÓN':'CALIBRATION FILE','Resultado actual':'Current result','Resultado base de calibración':'Calibration baseline','Brecha auto vs líder':'Self vs manager gap','Guardado por RH':'Saved by HR','Sin ajuste aún':'No adjustment yet',
    'COMPARATIVO':'COMPARISON','Radar de evaluación':'Evaluation radar','Ubicación 9-Box':'9-Box placement','CONTEXTO':'CONTEXT','Alertas para RH':'HR alerts',
    'DECISIÓN':'DECISION','Ajuste de calibración':'Calibration adjustment','Ajuste en puntos':'Point adjustment','Justificación obligatoria cuando exista ajuste':'Justification required when an adjustment is made',
    'AUDITORÍA':'AUDIT','Trazabilidad de cambios':'Change history','movimientos':'changes',
    'Alineada hasta':'Aligned up to','Guardar umbrales':'Save thresholds','Reinicio de datos':'Data reset','Reiniciar datos de la demo':'Reset demo data',
    'Carga al menos una evidencia antes de aceptar el resultado.':'Upload at least one piece of evidence before accepting the result.',
    'Verifica que "Alineada" sea menor que "Revisar".':'Make sure “Aligned” is lower than “Review”.','Umbrales actualizados.':'Thresholds updated.',
    '¿Reiniciar todos los datos de la demo? Esta acción no se puede deshacer.':'Reset all demo data? This action cannot be undone.',
    'No puedes enviar. Tienes':'You cannot submit. You have','pendientes; revisa lo marcado en rojo.':'pending fields; review those marked in red.'
  });

  // EN completeness patch — audited against employee, manager and HR screens.
  Object.assign(EN, {
    "Cronograma de seguimiento (6 semanas)": "Follow-up schedule (6 weeks)",
    "Aún no se genera cronograma.": "No follow-up schedule has been generated yet.",
    "Comentarios del líder": "Manager comments",
    "Evidencias": "Evidence",
    "Sin evidencias cargadas.": "No evidence uploaded.",
    "Simular carga de evidencia": "Simulate evidence upload",
    "Aceptar resultado": "Accept result",
    "Carga al menos una evidencia antes de aceptar": "Upload at least one piece of evidence before accepting the result.",
    "Evaluación de": "Evaluation of",
    "N.º DE EMPLEADO": "EMPLOYEE NO.",
    "N.° DE EMPLEADO": "EMPLOYEE NO.",
    "ÁREA": "AREA",
    "DIRECCIÓN": "BUSINESS UNIT",
    "CIUDAD OPERATIVA": "OPERATING CITY",
    "ANTIGÜEDAD": "TENURE",
    "PERIODO": "PERIOD",
    "MANAGER DIRECTO": "DIRECT MANAGER",
    "LÍDER DIRECTO": "DIRECT MANAGER",
    "La autoevaluación del colaborador permanecerá oculta hasta que envíes tu evaluación.": "The employee’s self-assessment will remain hidden until you submit your evaluation.",
    "Revisión final": "Final review",
    "REVISIÓN FINAL": "FINAL REVIEW",
    "Resumen y envío": "Summary and submission",
    "Registra retroalimentación cualitativa. Estos campos se mostrarán al colaborador cuando RH habilite la fase de retroalimentación.": "Enter qualitative feedback. These fields will be shown to the employee when HR enables the feedback phase.",
    "Fortalezas del colaborador": "Employee strengths",
    "Strengths del colaborador": "Employee strengths",
    "Comentarios generales": "General comments",
    "Áreas de oportunidad y plan de mejora": "Development opportunities and improvement plan",
    "Development opportunities y plan de mejora": "Development opportunities and improvement plan",
    "Sin áreas registradas todavía.": "No development opportunities added yet.",
    "+ Agregar área de oportunidad": "+ Add development opportunity",
    "Plan de desarrollo": "Development plan",
    "Sin acciones registradas todavía.": "No development actions added yet.",
    "Sin acciones de desarrollo registradas.": "No development actions added.",
    "+ Agregar acción de desarrollo": "+ Add development action",
    "Confirmo que la evaluación está completa.": "I confirm that the evaluation is complete.",
    "Enviar evaluación ✓": "Submit evaluation ✓",
    "Diferencias detalladas por competencia": "Detailed differences by competency",
    "AUTOEVALUACIÓN": "SELF-ASSESSMENT",
    "EVALUACIÓN LÍDER": "MANAGER EVALUATION",
    "DIFERENCIA": "DIFFERENCE",
    "BRECHA": "GAP",
    "COMENTARIO LÍDER": "MANAGER COMMENT",
    "COMENTARIO COLABORADOR": "EMPLOYEE COMMENT",
    "Brecha significativa": "Significant gap",
    "Alineada": "Aligned",
    "Ubicación en la 9-Box Matrix": "9-Box Matrix placement",
    "Ubicación en la 9-Box": "9-Box placement",
    "Desempeño": "Performance",
    "Actitud": "Attitude",
    "Cumple a satisfacción tanto en actitud como en desempeño.": "Meets expectations in both attitude and performance.",
    "Acción sugerida:": "Suggested action:",
    "Action sugerida:": "Suggested action:",
    "Seguimiento:": "Follow-up:",
    "Status actual del proceso:": "Current process status:",
    "Estado actual del proceso:": "Current process status:",
    "La calibración y liberación de retroalimentación las gestiona el administrador de RH.": "Calibration and feedback release are managed by the HR administrator.",
    "Resultados por sección": "Results by section",
    "Radar comparativo": "Comparison radar",
    "promedio": "average",
    "Promedio": "Average",
    "Puntaje final sobre 100": "Final score out of 100",
    "Medio / esperado": "Medium / expected",
    "Preliminar potencial (esc. 1-5)": "Preliminary potential (scale 1-5)",
    "Potencial preliminar (esc. 1-5)": "Preliminary potential (scale 1-5)",
    "Puntaje de desempeño": "Performance score",
    "Resultado final": "Final result",
    "Puntaje": "Score",
    "PUNTAJE": "SCORE",
    "registros": "records",
    "Revisar": "Review",
    "Calibrar": "Calibrate",
    "Todas las áreas": "All areas",
    "Todos los roles": "All roles",
    "Todos los estatus": "All statuses",
    "Todos los estados": "All statuses",
    "Todos los cuadrantes": "All quadrants",
    "Todos los periodos": "All periods",
    "Con/sin líder (todos)": "With/without manager (all)",
    "Con líder": "With manager",
    "Sin líder": "Without manager",
    "Con/sin correo (todos)": "With/without email (all)",
    "Con correo": "With email",
    "Sin correo": "Without email",
    "Sin líder asignado": "No manager assigned",
    "Con líder asignado": "Manager assigned",
    "Sin resultados para los filtros aplicados.": "No results for the selected filters.",
    "Por revisar": "To review",
    "Resultado": "Result",
    "Líder:": "Manager:",
    "Antigüedad:": "Tenure:",
    "Guardado por RH": "Saved by HR",
    "Sin ajuste aún": "No adjustment yet",
    "Estos datos son contextuales. En esta demo no generan un descuento automático sobre la calificación.": "These data are contextual. In this demo they do not automatically reduce the rating.",
    "Observaciones de RH": "HR observations",
    "Ajuste en puntos": "Point adjustment",
    "Justificación obligatoria cuando exista ajuste": "Justification required when an adjustment is made",
    "Explica la razón del ajuste y la evidencia utilizada...": "Explain the reason for the adjustment and the evidence used...",
    "Si el resultado calibrado es menor a 80, se requerirá al menos un plan de desarrollo antes de liberar la retroalimentación.": "If the calibrated result is below 80, at least one development plan is required before feedback can be released.",
    "Sin cambios registrados.": "No changes recorded.",
    "Haz clic en un cuadrante para ver su significado y acción sugerida, o en el marcador de un colaborador para ver su detalle individual.": "Click a quadrant to see its meaning and suggested action, or click an employee marker to view individual details.",
    "Quitar selección individual": "Clear individual selection",
    "Sin colaboradores.": "No employees.",
    "Umbrales de brecha (comparación auto vs. líder)": "Gap thresholds (self vs. manager comparison)",
    "Alineada hasta": "Aligned up to",
    "Revisar hasta": "Review up to",
    "Reinicio de datos": "Data reset",
    "Restaura todos los datos de la demo a su estado inicial (usuarios, evaluaciones, calibraciones, auditoría). Esta acción no se puede deshacer.": "Restores all demo data to its initial state (users, evaluations, calibrations, audit). This action cannot be undone.",
    "Progreso de evaluación": "Evaluation progress",
    "Evaluación del líder": "Manager evaluation",
    "Guarda tu avance y verifica cada sección antes de enviar. La autoevaluación se mostrará después del envío.": "Save your progress and review each section before submitting. The self-assessment will be shown after submission.",
    "El colaborador no registró objetivos en este periodo.": "The employee did not enter goals for this period.",
    "Objetivo:": "Goal:",
    "Resultado:": "Result:",
    "Selecciona una calificación para continuar.": "Select a rating to continue.",
    "Área de oportunidad": "Development opportunity",
    "Plan de mejora": "Improvement plan",
    "Comparación —": "Comparison —",
    "Puntaje autoevaluación": "Self-assessment score",
    "Puntaje evaluación líder": "Manager evaluation score",
    "Sin datos": "No data",
    "Evaluaciones pendientes (líder)": "Pending manager evaluations",
    "Avance del equipo": "Team progress",
    "Alertas por vencimiento": "Deadline alerts",
    "Este colaborador no pertenece a tu equipo directo. Solo puedes evaluar a las personas cuyo líder registrado seas tú.": "This employee is not on your direct team. You can only evaluate employees for whom you are the registered manager.",
    "Este colaborador no pertenece a tu equipo directo. Solo puedes consultar la comparación de las personas cuyo líder registrado seas tú.": "This employee is not on your direct team. You can only view comparisons for employees for whom you are the registered manager.",
    "El colaborador aún no completa su autoevaluación. No es posible iniciar la evaluación del líder todavía.": "The employee has not completed the self-assessment yet. The manager evaluation cannot be started yet.",
    "Confirma que la información es correcta antes de enviar.": "Confirm that the information is correct before submitting.",
    "Confirmo que la información capturada es correcta.": "I confirm that the entered information is correct.",
    "Registra al menos un objetivo antes de enviar.": "Enter at least one goal before submitting.",
    "Confirma que la evaluación está completa antes de enviar.": "Confirm that the evaluation is complete before submitting.",
    "Área de oportunidad:": "Development opportunity:",
    "Plan de mejora:": "Improvement plan:",
    "Nombre del archivo a cargar (simulado), ej. retroalimentacion_firmada.pdf:": "File name to upload (simulated), e.g. signed_feedback.pdf:",
    "Tipo (PDF firmado / Imagen / Documento de retroalimentación):": "Type (Signed PDF / Image / Feedback document):",
    "PDF firmado": "Signed PDF",
    "Documento de retroalimentación": "Feedback document",
    "La justificación es obligatoria cuando existe un ajuste distinto de 0.": "Justification is required when the adjustment is not 0.",
    "Calibración de RH": "HR calibration",
    "Calibración guardada.": "Calibration saved.",
    "Guarda la calibración antes de habilitar la retroalimentación.": "Save the calibration before enabling feedback.",
    "El resultado es menor a 80. Registra al menos un plan de desarrollo antes de habilitar la retroalimentación.": "The result is below 80. Add at least one development plan before enabling feedback.",
    "Retroalimentación habilitada para el colaborador.": "Feedback enabled for the employee.",
    "Se envió un nuevo código.": "A new code was sent.",
    "Captura tu número de empleado.": "Enter your employee number.",
    "Error al solicitar código": "Error requesting code",
    "Error al validar código": "Error validating code",
    "Error en acceso rápido": "Quick-access error",
    "Inicio de sesión": "Sign-in",
    "Conexión segura mediante API corporativa.": "Secure connection through the corporate API.",
    "Código de demostración:": "Demo code:",
    "Reenviar código": "Resend code",
    "Cambiar empleado": "Change employee",
    "Periodo activo": "Active period",
    "Líder directo": "Direct manager",
    "Fecha límite autoevaluación": "Self-assessment deadline",
    "Ver retroalimentación": "View feedback",
    "Tu autoevaluación fue enviada. El proceso continúa con la evaluación de tu líder y la calibración de RH.": "Your self-assessment was submitted. The process continues with your manager’s evaluation and HR calibration.",
    "Hola,": "Hello,",
    "Sección": "Section",
    "de 4": "of 4",
    "Eje DESEMPEÑO": "PERFORMANCE axis",
    "Sin calificar": "Not rated",
    "Comentario (opcional)": "Comment (optional)",
    "Sin responder": "Not answered",
    "✓ Este objetivo cumple con los criterios SMART.": "✓ This goal meets the SMART criteria.",
    "Guía para redactar objetivos SMART": "Guide to writing SMART goals",
    "Quitar objetivo": "Remove goal",
    "Ej. Incrementar la cobertura...": "E.g. Increase coverage...",
    "Captura tus objetivos del periodo": "Enter your goals for the period",
    "Registra hasta cinco objetivos. Completa la meta, fecha y criterios SMART; solo se promedian los objetivos con descripción y calificación válida.": "Enter up to five goals. Complete the target, due date, and SMART criteria; only goals with a description and valid rating are averaged.",
    "CUMPLIMIENTO DE OBJETIVOS": "GOAL ACHIEVEMENT",
    "DEL TOTAL": "OF TOTAL",
    "Es alcanzable con los recursos y responsabilidades disponibles.": "It is achievable with the available resources and responsibilities.",
    "Está relacionado con las responsabilidades del puesto o prioridades del área.": "It is related to the role responsibilities or area priorities.",
    "General objective:": "General objective:",
    "SMART objective:": "SMART objective:",
    "S — Específico:": "S — Specific:",
    "M — Medible:": "M — Measurable:",
    "A — Alcanzable:": "A — Achievable:",
    "R — Relevante:": "R — Relevant:",
    "T — Temporal:": "T — Time-bound:",
    "Mejorar la conclusión satisfactoria de la capacitación.": "Improve successful completion of training.",
    "Pasar del 75% al 90%.": "Increase from 75% to 90%.",
    "Se establecen acciones concretas de seguimiento.": "Concrete follow-up actions are established.",
    "Fortalece la preparación de los colaboradores.": "Strengthens employee readiness.",
    "Se debe lograr en 3 meses.": "It must be achieved within 3 months.",
    "Quiero mejorar la capacitación de los colaboradores.": "I want to improve employee training.",
    "Incrementar del 75% al 90% el porcentaje de colaboradores que concluyen satisfactoriamente la capacitación de inducción, durante los próximos 3 meses, mediante seguimiento semanal, recordatorios y evaluación de conocimientos al finalizar el curso.": "Increase from 75% to 90% the percentage of employees who successfully complete induction training over the next 3 months through weekly follow-up, reminders, and a knowledge assessment at the end of the course.",
    "Ciudad de México": "Mexico City",
    "Recursos Humanos": "Human Resources",
    "Finanzas": "Finance",
    "Operaciones": "Operations",
    "Tecnología": "Technology",
    "Comercial": "Commercial",
    "Analista de Recursos Humanos": "Human Resources Analyst",
    "Gerente de Recursos Humanos": "Human Resources Manager",
    "Coordinador de Nómina": "Payroll Coordinator",
    "Analista Contable": "Accounting Analyst",
    "Analista de Tesorería": "Treasury Analyst",
    "Supervisora de Zona": "Area Supervisor",
    "Coordinador Operativo": "Operations Coordinator",
    "Analista de Sistemas": "Systems Analyst",
    "Soporte Técnico Sr.": "Senior Technical Support",
    "Ejecutiva de Cuenta": "Account Executive",
    "Coordinador Comercial": "Commercial Coordinator",
    "Analista Junior de Operaciones": "Junior Operations Analyst"
});

  const ATTR_EN = {
    'Cerrar sesión':'Sign out',
    'Ingresa tu número de empleado':'Enter your employee number',
    'Competencia a desarrollar:':'Competency to develop:',
    'Acción:':'Action:',
    'Fecha compromiso (AAAA-MM-DD):':'Due date (YYYY-MM-DD):'
  };

  function t(text) { return currentLang === 'en' ? (EN[text] || text) : text; }
  function setLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'es';
    localStorage.setItem(LANG_KEY, currentLang);
    document.documentElement.lang = currentLang;
    document.title = currentLang === 'en' ? 'Inter-Con EDD — Administrative Performance Evaluation' : 'Plataforma EDD Inter-Con — Evaluación del Desempeño Administrativo';
    render();
    // El modal de IA SMART vive fuera de #app-root (para sobrevivir los
    // render() del wizard), así que no se retraduce solo con render(): hay
    // que refrescarlo aparte si está abierto.
    if (state.aiSmart.open) renderAiSmartModal();
  }

  function translateDOM(root) {
    document.documentElement.lang = currentLang;
    if (currentLang !== 'en' || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const raw = node.nodeValue || '';
      const trimmed = raw.trim();
      if (!trimmed) return;
      const normalized = trimmed.replace(/\s+/g, ' ');
      let translated = EN[trimmed] || EN[normalized] || normalized;
      if (translated === normalized) {
        // Dynamic values that are not fixed UI labels (names, counts and tenure).
        const greeting = normalized.match(/^¡Bienvenid[oa],\s*(.+)!$/i);
        const evalOf = normalized.match(/^Evaluación de\s+(.+)$/i);
        const thanks = normalized.match(/^Gracias por tu participación,\s*(.+)\.$/i);
        if (greeting) translated = `Welcome, ${greeting[1]}!`;
        else if (evalOf) translated = `Evaluation of ${evalOf[1]}`;
        else if (thanks) translated = `Thank you for participating, ${thanks[1]}.`;
        else {
          translated = translated
            .replace(/(\d+)\s+año(?:s)?\b/gi, (_, n) => `${n} year${n === '1' ? '' : 's'}`)
            .replace(/(\d+)\s+mes(?:es)?\b/gi, (_, n) => `${n} month${n === '1' ? '' : 's'}`)
            .replace(/(\d+)\s+semanas?\b/gi, (_, n) => `${n} week${n === '1' ? '' : 's'}`);
        }
        const keys = Object.keys(EN).sort((a, b) => b.length - a.length);
        keys.forEach((key) => {
          if (translated.includes(key)) translated = translated.split(key).join(EN[key]);
        });
      }
      if (translated !== normalized) node.nodeValue = raw.replace(trimmed, translated);
    });
    root.querySelectorAll('[placeholder],[title],[aria-label]').forEach((el) => {
      ['placeholder','title','aria-label'].forEach((attr) => {
        const v = el.getAttribute(attr);
        if (v && (EN[v] || ATTR_EN[v])) el.setAttribute(attr, EN[v] || ATTR_EN[v]);
      });
    });
  }

  function languageSwitcher(compact) {
    return `<div class="language-switch ${compact ? 'language-switch-compact' : ''}" role="group" aria-label="Idioma / Language">
      <button type="button" class="language-option ${currentLang === 'es' ? 'active' : ''}" onclick="App.setLanguage('es')">ES</button>
      <button type="button" class="language-option ${currentLang === 'en' ? 'active' : ''}" onclick="App.setLanguage('en')">EN</button>
    </div>`;
  }

  const state = {
    user: null,       // {empleado, nombre, perfil} — derivado de EDDAuth.getAppUser()
    periodo: null,
    wizard: { seccionIdx: 0, evaluacionId: null, tipo: null, colaboradorId: null, liderId: null },
    adminFiltros: {},
    usuariosFiltros: {},
    jerarquiasFiltros: {},
    nineboxSel: null,
    nineboxSelEmpleado: null,
    // --- Estado del login de dos pasos (beta 3) ---
    login: {
      paso: 'solicitar',   // 'solicitar' | 'validar'
      numeroEmpleado: '',
      maskedEmail: null,
      loading: false,
      error: null,
      info: null,
      sessionExpiredNotice: false
    }
  };

  // =========================================================================
  // UTILIDADES
  // =========================================================================
  const $ = (sel, root) => (root || document).querySelector(sel);
  function h(strings) { return strings; } // noop, mantiene legibilidad de template literals
  function esc(str) { return String(str === null || str === undefined ? '' : str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function f1(n) { return (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toFixed(1); }
  function pct(n) { return Math.max(0, Math.min(100, Math.round(n))); }

  const ESTADO_COLOR = {
    'No iniciada': 'gray', 'En progreso': 'yellow', 'Completada': 'green',
    'Pendiente de líder': 'yellow', 'Pendiente de calibración': 'yellow', 'Calibrada': 'blue',
    'Retroalimentación pendiente': 'yellow', 'Cerrada': 'green'
  };
  function badge(texto, color) {
    return `<span class="badge badge-${color || ESTADO_COLOR[texto] || 'gray'}">${esc(t(texto))}</span>`;
  }

  function progressBar(percent, color) {
    const p = pct(percent);
    return `<div class="progress"><div class="progress-bar" style="width:${p}%;background:${color || 'var(--azul-marino)'}"></div></div><div class="progress-label">${p}%</div>`;
  }

  function escalaHelpHTML() {
    return `<div class="escala-help"><strong>Escala de evaluación</strong>` +
      D.ESCALA.map((e) => `<div class="escala-row"><span class="escala-valor">${esc(e.valor)}</span><span>${esc(e.descripcion)}</span></div>`).join('') +
      `</div>`;
  }

  function fechaHoy() { return '2026-07-28'; } // fecha de referencia de la demo (ver <env>)
  function esVencido(fechaLimite) { return fechaLimite && fechaHoy() > fechaLimite; }

  // =========================================================================
  // SESIÓN (delegada en auth.js — ver EDDAuth). Este bloque solo resuelve la
  // navegación posterior al login/logout y el registro en auditoría local.
  // =========================================================================
  function irAHomeDePerfil(perfil) {
    navigate(perfil === 'colaborador' ? '#/colaborador/bienvenida' : (perfil === 'lider' ? '#/lider/dashboard' : '#/admin/dashboard'));
  }

  function introKey() {
    return state.user ? `edd_intro_rev4_${state.user.empleado}` : 'edd_intro_rev4';
  }
  function introVista() { return sessionStorage.getItem(introKey()) === '1'; }
  function marcarIntroVista() { sessionStorage.setItem(introKey(), '1'); }

  function resetLoginState(paso) {
    state.login = {
      paso: paso || 'solicitar',
      numeroEmpleado: state.login ? state.login.numeroEmpleado : '',
      maskedEmail: null,
      loading: false,
      error: null,
      info: null,
      sessionExpiredNotice: state.login ? state.login.sessionExpiredNotice : false
    };
  }

  async function logout() {
    if (state.user) {
      S.addAudit(state.user.nombre, 'Cierre de sesión', 'usuarios', state.user.empleado, null, null);
      sessionStorage.removeItem(introKey());
    }
    if (state.aiSmart.open) { state.aiSmart.open = false; renderAiSmartModal(); }
    await A.logout();
    state.user = null;
    resetLoginState('solicitar');
    navigate('#/login');
  }

  // =========================================================================
  // ROUTER
  // =========================================================================
  function navigate(hash) { if (location.hash === hash) { render(); } else { location.hash = hash; } }
  function parseHash() {
    const h = location.hash.replace(/^#\//, '');
    const parts = h.split('/').filter(Boolean);
    return parts;
  }

  function render() {
    const root = document.getElementById('app-root');
    const teniaUsuario = !!state.user;
    const session = A.getSession();
    state.user = session ? A.getAppUser(session) : null;

    if (!state.user) {
      // Si había sesión activa y ya no la hay (y no fue por un logout manual
      // que ya limpió el aviso), asumimos que expiró y lo mostramos en login.
      if (teniaUsuario && !state.login.sessionExpiredNotice) {
        state.login.sessionExpiredNotice = true;
      }
      root.innerHTML = viewLogin();
      bindLogin();
      translateDOM(root);
      return;
    }
    state.periodo = S.getPeriodoActivo();

    const parts = parseHash();
    const areaEsperada = state.user.perfil === 'colaborador' ? 'colaborador' : state.user.perfil === 'lider' ? 'lider' : 'admin';
    const area = parts[0] || areaEsperada;
    const page = parts[1] || (areaEsperada === 'colaborador' ? 'inicio' : 'dashboard');
    const param = parts[2];

    // Seguridad de navegación: el rol de la URL nunca puede sustituir al rol
    // de la sesión. Si el usuario modifica manualmente el hash, vuelve a su portal.
    if (area !== areaEsperada) {
      navigate(areaEsperada === 'colaborador' ? '#/colaborador/inicio' : areaEsperada === 'lider' ? '#/lider/dashboard' : '#/admin/dashboard');
      return;
    }

    let body = '';
    if (area === 'colaborador') body = renderColaborador(page);
    else if (area === 'lider') body = renderLider(page, param);
    else if (area === 'admin') body = renderAdmin(page, param);
    else {
      navigate(areaEsperada === 'colaborador' ? '#/colaborador/inicio' : areaEsperada === 'lider' ? '#/lider/dashboard' : '#/admin/dashboard');
      return;
    }

    root.innerHTML = renderHeader(area, page) + `<main class="container">${body}</main>` + renderFooter();
    bindGlobal();
    translateDOM(root);
  }

  // =========================================================================
  // HEADER / NAV / FOOTER
  // =========================================================================
  function renderHeader(area, page) {
    const u = state.user;
    const per = state.periodo;
    let tabs = [];
    if (u.perfil === 'colaborador') {
      tabs = [['inicio', 'Inicio'], ['autoevaluacion', 'Autoevaluación'], ['retroalimentacion', 'Retroalimentación']];
    } else if (u.perfil === 'lider') {
      tabs = [['dashboard', 'Mi equipo'], ['pendientes', 'Pendientes por evaluar']];
    } else {
      tabs = [['dashboard', 'Dashboard'], ['calibracion', 'Calibración'], ['9box', 'Matriz 9-Box'], ['usuarios', 'Usuarios'], ['jerarquias', 'Jerarquías'], ['auditoria', 'Auditoría'], ['config', 'Configuración']];
    }
    const navHtml = tabs.map((t) => `<a href="#/${area === 'colaborador' ? 'colaborador' : area}/${t[0]}" class="${page === t[0] ? 'active' : ''}">${t[1]}</a>`).join('');
    const iniciales = esc((u.nombre || '').split(/\s+/).slice(0,2).map(x => x[0] || '').join('').toUpperCase());
    return `
    <header class="app-header premium-header">
      <div class="app-header-top premium-header-top">
        <div class="brand premium-brand">
          <img src="assets/ic-seguridad-privada.png" alt="IC Seguridad Privada" />
        </div>
        <nav class="nav-tabs premium-nav-tabs">${navHtml}</nav>
        <div class="premium-user-menu">
          <span class="premium-user-avatar">${iniciales}</span>
          <span class="premium-user-copy"><strong>${esc(u.nombre)}</strong><small>${capitalize(u.perfil)} · ${esc(per ? per.nombre : '')}</small></span>
          ${languageSwitcher(true)}
          <button class="premium-logout" onclick="App.logout()" title="Cerrar sesión"><span class="logout-icon">↪</span><span class="logout-label">Cerrar sesión</span></button>
        </div>
      </div>
    </header>`;
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderFooter() {
    return `<footer class="app-footer">Demo funcional EDD Inter-Con — FOR-CAP-003 Rev. 4 · Datos simulados almacenados localmente en este navegador.</footer>`;
  }

  function bindGlobal() {
    document.querySelectorAll('[data-tooltip-toggle]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const panel = document.getElementById(btn.getAttribute('data-tooltip-toggle'));
        if (panel) panel.classList.toggle('open');
      });
    });
  }

  // =========================================================================
  // LOGIN (dos pasos: solicitar código -> validar código) — beta 3
  // =========================================================================
  let countdownInterval = null;

  function detenerCountdown() { if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; } }

  function iniciarCountdown() {
    detenerCountdown();
    countdownInterval = setInterval(() => {
      const pend = A.pendienteActual();
      const el = document.getElementById('loginCountdown');
      if (!pend || !el) { detenerCountdown(); return; }
      const restanteMs = pend.expiresAt - Date.now();
      if (restanteMs <= 0) {
        el.textContent = 'vencido';
        el.classList.add('countdown-vencido');
        detenerCountdown();
        return;
      }
      const mm = Math.floor(restanteMs / 60000);
      const ss = Math.floor((restanteMs % 60000) / 1000);
      el.textContent = mm + ':' + String(ss).padStart(2, '0');
    }, 1000);
  }

  function viewLogin() {
    const L = state.login;
    const avisoExpirada = L.sessionExpiredNotice
      ? `<p class="alert alert-warning premium-login-alert">Tu sesión anterior expiró por inactividad. Inicia sesión de nuevo.</p>`
      : '';
    const cuerpo = L.paso === 'validar' ? viewLoginValidar(L) : viewLoginSolicitar(L);
    return `
    <div class="login-screen premium-login-screen">
      <section class="premium-login-shell">
        <div class="premium-login-brand-panel">
          <div class="premium-login-overlay"></div>
          <div class="premium-login-brand-content">
            <img class="premium-login-logo" src="assets/ic-seguridad-privada.png" alt="IC Seguridad Privada" />
            <div class="premium-login-kicker">Plataforma corporativa</div>
            <h1>Evaluación de Desempeño<br>Administrativo</h1>
            <p>Una experiencia simple, segura y confidencial para impulsar tu desarrollo dentro de Inter-Con.</p>
          </div>
          <div class="premium-login-trust">
            <div><span>◇</span><strong>Seguro</strong><small>Tus datos están protegidos</small></div>
            <div><span>▣</span><strong>Confidencial</strong><small>Información de uso interno</small></div>
            <div><span>↗</span><strong>Desarrollo</strong><small>Impulsamos tu crecimiento</small></div>
          </div>
        </div>
        <div class="premium-login-form-panel">
          <div class="premium-login-form-wrap">
            <div class="premium-login-lang">${languageSwitcher(false)}</div>
            <div class="premium-login-mobile-logo"><img src="assets/ic-seguridad-privada.png" alt="IC Seguridad Privada" /></div>
            <div class="premium-login-step">${L.paso === 'validar' ? 'Verificación de identidad' : 'Bienvenido(a)'}</div>
            <h2>${L.paso === 'validar' ? 'Ingresa tu código de acceso' : 'Inicia sesión'}</h2>
            <p class="premium-login-description">${L.paso === 'validar' ? 'Revisa tu correo corporativo y captura el código temporal de 6 dígitos.' : 'Utiliza tu número de empleado para acceder a tu evaluación.'}</p>
            ${avisoExpirada}
            ${cuerpo}
            <div class="premium-login-security">▾ &nbsp; Acceso protegido · Uso exclusivo de personal autorizado</div>
          </div>
        </div>
      </section>
    </div>`;
  }

  function viewLoginSolicitar(L) {
    const modoApi = global.APP_CONFIG.mode === 'api';
    return `
    <div class="login-form premium-login-form">
      <label for="loginEmpleado">Número de empleado</label>
      <div class="premium-input-wrap"><span>♙</span><input id="loginEmpleado" type="text" inputmode="numeric" placeholder="Ingresa tu número de empleado" value="${esc(L.numeroEmpleado)}" /></div>
      <p class="premium-field-help">Te enviaremos un código de verificación a tu correo corporativo.</p>
      ${L.error ? `<p class="alert alert-danger">${esc(L.error)}</p>` : ''}
      ${L.info ? `<p class="alert alert-info">${esc(L.info)}</p>` : ''}
      <button class="btn btn-primary btn-block premium-login-primary" id="btnSolicitarCodigo" ${L.loading ? 'disabled' : ''}>${L.loading ? 'Enviando…' : 'Continuar'} <span>→</span></button>
      ${modoApi ? '<p class="muted premium-api-note">Conexión segura mediante API corporativa.</p>' : ''}
    </div>
    ${!modoApi ? `<details class="premium-demo-access"><summary>Accesos de demostración</summary><div class="quick-access">
      <button class="btn btn-outline btn-block" data-quick="10001">Colaborador · Laura Hernández</button>
      <button class="btn btn-outline btn-block" data-quick="20001">Líder · Carlos Martínez</button>
      <button class="btn btn-outline btn-block" data-quick="90001">Administrador · RH</button>
      <small>Código demo: ${esc(global.APP_CONFIG.demoCode)}</small>
    </div></details>` : ''}`;
  }

  function viewLoginValidar(L) {
    const modoApi = global.APP_CONFIG.mode === 'api';
    return `
    <div class="login-form premium-login-form">
      <div class="premium-code-sent">✓ Código enviado${L.maskedEmail ? ' a <strong>' + esc(L.maskedEmail) + '</strong>' : ''}</div>
      <label for="loginCodigo">Código temporal</label>
      <input class="premium-code-input" id="loginCodigo" type="text" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="one-time-code" />
      <p class="premium-field-help">El código vence en <strong id="loginCountdown">${esc(global.APP_CONFIG.codeValidityMinutes)}:00</strong> minutos.</p>
      ${!modoApi ? `<p class="muted premium-demo-code">Código de demostración: <strong>${esc(global.APP_CONFIG.demoCode)}</strong></p>` : ''}
      ${L.error ? `<p class="alert alert-danger">${esc(L.error)}</p>` : ''}
      ${L.info ? `<p class="alert alert-info">${esc(L.info)}</p>` : ''}
      <button class="btn btn-primary btn-block premium-login-primary" id="btnValidarCodigo" ${L.loading ? 'disabled' : ''}>${L.loading ? 'Validando…' : 'Ingresar a la plataforma'} <span>→</span></button>
      <div class="login-secondary-actions premium-login-secondary">
        <button class="btn btn-outline btn-sm" id="btnReenviarCodigo" ${L.loading ? 'disabled' : ''}>Reenviar código</button>
        <button class="btn btn-outline btn-sm" id="btnCorregirEmpleado" ${L.loading ? 'disabled' : ''}>Cambiar empleado</button>
      </div>
    </div>`;
  }

  function bindLogin() {
    detenerCountdown();
    if (state.login.paso === 'validar') {
      iniciarCountdown();
      $('#btnValidarCodigo').addEventListener('click', () => Actions.validarCodigo());
      $('#btnReenviarCodigo').addEventListener('click', () => Actions.reenviarCodigo());
      $('#btnCorregirEmpleado').addEventListener('click', () => Actions.corregirEmpleado());
      const inputCodigo = $('#loginCodigo');
      if (inputCodigo) inputCodigo.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') Actions.validarCodigo(); });
    } else {
      $('#btnSolicitarCodigo').addEventListener('click', () => Actions.solicitarCodigo($('#loginEmpleado').value.trim()));
      const inputEmpleado = $('#loginEmpleado');
      if (inputEmpleado) inputEmpleado.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') Actions.solicitarCodigo(inputEmpleado.value.trim()); });
      document.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => Actions.quickLogin(b.getAttribute('data-quick'))));
    }
  }

  // =========================================================================
  // PORTAL COLABORADOR
  // =========================================================================
  function renderColaborador(page) {
    const col = S.getColaborador(state.user.empleado);
    const periodoId = state.periodo.id;
    const estado = S.estadoProceso(col.empleado, periodoId);

    if (page === 'bienvenida') return viewBienvenidaEvaluacion(col, periodoId, estado);
    if (page === 'autoevaluacion' && !introVista() && (estado === D.ESTADOS.NO_INICIADA || estado === D.ESTADOS.EN_PROGRESO)) {
      return viewBienvenidaEvaluacion(col, periodoId, estado);
    }
    if (page === 'autoevaluacion') return viewAutoevaluacion(col, periodoId, estado);
    if (page === 'retroalimentacion') return viewRetroalimentacion(col, periodoId, estado);
    if (page === 'enviado') return viewEnvioExitoso(col);
    return viewColaboradorInicio(col, periodoId, estado);
  }

  function viewBienvenidaEvaluacion(col, periodoId, estado) {
    const enProgreso = estado === D.ESTADOS.EN_PROGRESO;
    const primerNombre = esc((col.nombre || '').trim().split(/\s+/)[0] || '');
    return `
    <section class="welcome-page">
      <div class="welcome-hero">
        <div class="welcome-hero-copy">
          <div class="welcome-eyebrow">Evaluación de Desempeño Administrativo</div>
          <h1>¡Bienvenida, ${primerNombre}! <span class="welcome-wave">👋</span></h1>
          <p class="welcome-lead">Esta evaluación nos ayuda a conocer tu desempeño, reconocer tus fortalezas e identificar oportunidades de desarrollo que impulsen tu crecimiento dentro de Inter-Con.</p>

          <div class="welcome-persona">
            <div class="welcome-persona-block">
              <div class="welcome-persona-icon">▣</div>
              <div><strong>${esc(col.nombre)}</strong><span>${esc(col.puesto)}</span></div>
            </div>
            <div class="welcome-persona-divider"></div>
            <div class="welcome-persona-block">
              <div class="welcome-persona-icon">⌘</div>
              <div><strong>${esc(col.area || 'Área')}</strong><span>${esc(col.area || '')}</span></div>
            </div>
          </div>
        </div>

        <div class="welcome-hero-art" aria-hidden="true">
          <div class="welcome-building">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="welcome-quote">
            <div class="welcome-quote-mark">“</div>
            <p>Tu opinión y compromiso contribuyen a construir un mejor Inter-Con.</p>
            <i></i>
          </div>
        </div>
      </div>

      <div class="welcome-info-grid">
        <article class="welcome-card">
          <div class="welcome-card-icon icon-blue">◷</div>
          <h3>Duración estimada</h3>
          <div class="welcome-big-number">15 a 20<br>minutos</div>
          <p>Procura realizar la evaluación en un solo momento y sin interrupciones.</p>
        </article>

        <article class="welcome-card">
          <div class="welcome-card-icon icon-purple">👥</div>
          <h3>¿Quién participa?</h3>
          <ul class="welcome-check-list purple-list">
            <li>Tu autoevaluación.</li>
            <li>La evaluación de tu líder.</li>
            <li>Retroalimentación para tu desarrollo.</li>
          </ul>
        </article>

        <article class="welcome-card">
          <div class="welcome-card-icon icon-yellow">★</div>
          <h3>Antes de comenzar</h3>
          <ul class="welcome-check-list yellow-list">
            <li>Responde con honestidad y objetividad.</li>
            <li>Considera tu desempeño durante el periodo evaluado.</li>
            <li>Lee cuidadosamente cada pregunta.</li>
          </ul>
        </article>

        <article class="welcome-card">
          <div class="welcome-card-icon icon-green">▣</div>
          <h3>Confidencialidad</h3>
          <p>Tus respuestas serán tratadas de forma confidencial y se utilizarán exclusivamente para apoyar tu desarrollo y fortalecer nuestro proceso de gestión del desempeño.</p>
        </article>

        <article class="welcome-card welcome-card-integracion">
          <div class="welcome-card-icon icon-blue">◔</div>
          <h3>¿Cómo se integra?</h3>
          <p class="welcome-integracion-title"><strong>Valores y Actitud 40%</strong> +<br><strong>Técnica Funcional 60%</strong></p>
          <div class="welcome-weight-list">
            <span><i class="dot-blue"></i>Valores y Actitud <b>40%</b></span>
            <span><i class="dot-purple"></i>Conocimientos y Habilidades Técnicas <b>30%</b></span>
            <span><i class="dot-green"></i>Cumplimiento de Objetivos <b>30%</b></span>
            <span><i class="dot-yellow"></i></span>
          </div>
        </article>
      </div>

      <div class="welcome-scale">
        <div class="welcome-scale-title">
          <div class="welcome-scale-icon">▥</div>
          <strong>Escala de<br>evaluación</strong>
        </div>
        <div class="welcome-scale-item score-5"><b>5</b><span><strong>Excede</strong> significativamente las expectativas.</span></div>
        <div class="welcome-scale-item score-4"><b>4</b><span><strong>Supera</strong> las expectativas de manera constante.</span></div>
        <div class="welcome-scale-item score-3"><b>3</b><span><strong>Cumple</strong> con lo esperado para su puesto.</span></div>
        <div class="welcome-scale-item score-2"><b>2</b><span><strong>Cumple parcialmente;</strong> requiere mejorar.</span></div>
        <div class="welcome-scale-item score-1"><b>1</b><span><strong>No cumple</strong> con las expectativas del puesto.</span></div>
        <div class="welcome-scale-item score-na"><b>N/A</b><span>No aplica o no cuento con elementos suficientes para evaluarlo.</span></div>
      </div>

      <div class="welcome-actions">
        <button class="btn welcome-start-btn" onclick="App.comenzarEvaluacion()">→&nbsp;&nbsp;${enProgreso ? 'Continuar mi evaluación' : 'Comenzar mi evaluación'}</button>
        <div class="welcome-important">◈ &nbsp;Tu evaluación es importante</div>
      </div>
    </section>`;
  }

  function viewEnvioExitoso(col, yaEnviada) {
    return `
    <section class="premium-success-page">
      <div class="premium-success-icon">✓</div>
      <div class="premium-success-confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <h1>${yaEnviada ? 'Tu evaluación ya fue enviada' : '¡Evaluación enviada con éxito!'}</h1>
      <p>Gracias por tu participación, ${esc((col.nombre || '').split(/\s+/)[0] || '')}.</p>
      <div class="premium-success-note"><span>✉</span><div><strong>Tu autoevaluación ha sido registrada correctamente.</strong><small>Tu líder recibirá la notificación correspondiente para continuar con el proceso.</small></div></div>
      <a class="btn btn-primary premium-success-home" href="#/colaborador/inicio">⌂ &nbsp; Ir al inicio</a>
      <div class="premium-success-footer">◇ &nbsp; Tu compromiso impulsa tu desarrollo y el éxito de Inter-Con.</div>
    </section>`;
  }

  function viewColaboradorInicio(col, periodoId, estado) {
    const autoEval = S.getEvaluacion(col.empleado, periodoId, 'autoevaluacion');
    let avance = 0;
    if (autoEval) {
      const total = D.COMPETENCIAS.actitud.length + D.COMPETENCIAS.habilidades.length + 1;
      const respondidas = S.getRespuestas(autoEval.id).length;
      const objetivosOk = S.getObjetivos(autoEval.id).some((o) => o.descripcion && o.descripcion.trim());
      avance = pct(((respondidas + (objetivosOk ? 1 : 0)) / total) * 100);
    }
    const vencida = esVencido(state.periodo.fechaLimiteAutoevaluacion) && estado === D.ESTADOS.NO_INICIADA;
    const liderDirecto = S.getLider(col.liderId);

    let accion = '';
    if (estado === D.ESTADOS.NO_INICIADA || estado === D.ESTADOS.EN_PROGRESO) {
      accion = `<a class="btn btn-primary" href="#/${estado === D.ESTADOS.NO_INICIADA ? 'colaborador/bienvenida' : 'colaborador/autoevaluacion'}">${estado === D.ESTADOS.NO_INICIADA ? 'Iniciar autoevaluación' : 'Continuar autoevaluación'}</a>`;
    } else if (estado === D.ESTADOS.RETRO_PENDIENTE || estado === D.ESTADOS.CERRADA) {
      accion = `<a class="btn btn-primary" href="#/colaborador/retroalimentacion">Ver retroalimentación</a>`;
    } else {
      accion = `<p class="muted">Tu autoevaluación fue enviada. El proceso continúa con la evaluación de tu líder y la calibración de RH.</p>`;
    }

    return `
    <div class="card">
      <h2>Hola, ${esc(col.nombre)}</h2>
      <p class="muted">${esc(col.puesto)} · ${esc(col.area)} · ${esc(col.ciudad)}</p>
      <div class="info-grid">
        <div><span class="label">Periodo activo</span><span class="value">${esc(state.periodo.nombre)}</span></div>
        <div><span class="label">Estado</span>${badge(estado)}</div>
        <div><span class="label">Líder directo</span><span class="value">${esc(liderDirecto ? liderDirecto.nombre : '—')}</span></div>
        <div><span class="label">Fecha límite autoevaluación</span><span class="value">${state.periodo.fechaLimiteAutoevaluacion}${vencida ? ' ' + badge('Vencida', 'red') : ''}</span></div>
      </div>
      <div class="progress-wrap">${progressBar(avance)}</div>
      <div class="actions">${accion}</div>
    </div>`;
  }

  function ensureWizard(col, periodoId) {
    const ev = S.getOrCreateEvaluacion(col.empleado, col.liderId, periodoId, 'autoevaluacion');
    if (state.wizard.evaluacionId !== ev.id) { state.wizard = { seccionIdx: 0, evaluacionId: ev.id, tipo: 'autoevaluacion', colaboradorId: col.empleado, liderId: col.liderId }; }
    return ev;
  }

  const SECCIONES_WIZARD = ['actitud', 'habilidades', 'objetivos', 'resumen'];

  function viewAutoevaluacion(col, periodoId, estado) {
    const ev = ensureWizard(col, periodoId);
    if (ev.estado === D.ESTADOS.COMPLETADA) {
      return viewEnvioExitoso(col, true);
    }
    const idx = state.wizard.seccionIdx;
    const seccion = SECCIONES_WIZARD[idx];
    const progreso = Math.round(((idx + (seccion === 'resumen' ? 1 : 0)) / SECCIONES_WIZARD.length) * 100);
    const respuestasPorSeccion = S.getRespuestasPorSeccion(ev.id);
    const counts = {
      actitud: (respuestasPorSeccion.actitud || []).filter(r => r.valor !== '' && r.valor !== null && r.valor !== undefined).length,
      habilidades: (respuestasPorSeccion.habilidades || []).filter(r => r.valor !== '' && r.valor !== null && r.valor !== undefined).length,
      objetivos: S.getObjetivos(ev.id).filter(o => (o.descripcion || '').trim() && o.calificacion).length
    };
    const total = { actitud:D.COMPETENCIAS.actitud.length, habilidades:D.COMPETENCIAS.habilidades.length, objetivos:5 };

    let contenido = '';
    if (seccion === 'objetivos') contenido = renderObjetivosForm(ev, false);
    else if (seccion === 'resumen') contenido = renderResumenAuto(ev);
    else contenido = renderSeccionForm(ev, seccion, false);

    const sideSections = ['actitud','habilidades','objetivos'].map((s,i) => `
      <button class="premium-section-step ${seccion === s ? 'active' : ''} ${i < idx ? 'done' : ''}" onclick="App.irSeccionWizard(${i})">
        <span><strong>${labelSeccion(s)}</strong><small>${s === 'actitud' ? 'Eje ACTITUD' : 'Eje DESEMPEÑO'}</small></span>
        <b>${counts[s]}/${total[s]}</b>
      </button>`).join('');

    return `
    <section class="premium-evaluation-page">
      <div class="premium-progress-head"><div><span>Progreso general</span><div class="progress"><div class="progress-bar" style="width:${progreso}%"></div></div></div><strong>${progreso}%</strong></div>
      <div class="premium-evaluation-layout">
        <aside class="premium-evaluation-sidebar">
          ${sideSections}
          <div class="premium-reminder-card"><strong>Recordatorio</strong><p>Puedes guardar tu progreso en cualquier momento. Tu evaluación es confidencial.</p></div>
          ${escalaSidebarHTML()}
        </aside>
        <div class="premium-evaluation-main">
          <div class="premium-evaluation-title">${seccion !== 'resumen' && D.SECCIONES_META[seccion] ? `<div class="premium-section-weight">Peso de la sección: <strong>${D.SECCIONES_META[seccion].peso}%</strong></div>` : ''}<span class="premium-section-kicker">${seccion === 'resumen' ? 'Revisión final' : 'Sección ' + (idx + 1) + ' de 3'}</span><h1>${labelSeccion(seccion)}</h1></div>
          ${contenido}
          <div class="wizard-nav premium-wizard-nav">
            <button class="btn btn-outline" ${idx === 0 ? 'disabled' : ''} onclick="App.wizardPrev()">← Anterior</button>
            <button class="btn btn-outline premium-save-btn" onclick="App.guardarProgresoVisual()">Guardar progreso</button>
            ${seccion === 'resumen'
              ? `<label class="confirm-check premium-confirm premium-confirm-large"><input type="checkbox" id="confirmEnvioAuto"/> Confirmo que la información capturada es correcta.</label><button class="btn btn-primary premium-next-btn" onclick="App.enviarAutoevaluacion()">Finalizar y enviar ✓</button>`
              : `<button class="btn btn-primary premium-next-btn" onclick="App.wizardNext('${seccion}')">Siguiente →</button>`}
          </div>
        </div>
      </div>
    </section>`;
  }

  function labelSeccion(s) {
    return { actitud: 'A. Valores y Actitud', habilidades: 'B. Conocimientos y Habilidades Técnicas', conocimientos: 'Sección interna', objetivos: 'C. Cumplimiento de Objetivos', resumen: 'Resumen y envío' }[s];
  }

  function renderSeccionForm(ev, seccion, soloLectura) {
    const meta = D.SECCIONES_META[seccion];
    const competencias = D.COMPETENCIAS[seccion];
    const respuestas = S.getRespuestasPorSeccion(ev.id)[seccion];
    const mapVal = {}; respuestas.forEach((r) => { mapVal[r.competenciaId] = r; });
    return `
    <p class="muted">${esc(meta.descripcion)}</p>
    ${escalaHelpInline()}
    ${competencias.map((c) => renderCompetenciaCard(ev.id, seccion, c, mapVal[c.id], soloLectura)).join('')}
    `;
  }

  function escalaHelpInline() {
    // Rev.4 UX: la escala ya no se repite dentro de cada sección. Se mantiene
    // siempre visible en la barra lateral para evitar ruido y desplazamientos.
    return '';
  }

  function escalaSidebarHTML() {
    const rows = [
      { n: 5, label: 'Excede significativamente' },
      { n: 4, label: 'Supera expectativas' },
      { n: 3, label: 'Cumple lo esperado' },
      { n: 2, label: 'Cumple parcialmente' },
      { n: 1, label: 'No cumple' }
    ];
    return `<div class="premium-scale-card" aria-label="Escala de evaluación permanente">
      <div class="premium-scale-title"><strong>Escala de evaluación</strong><span>Siempre visible</span></div>
      <div class="premium-scale-list">${rows.map((r) => `<div class="premium-scale-row"><span class="premium-scale-stars">${'★'.repeat(r.n)}${'☆'.repeat(5-r.n)}</span><span><b>${r.n}</b> ${r.label}</span></div>`).join('')}</div>
      <div class="premium-scale-na"><b>N/A</b><span>No aplica o no hay elementos suficientes.</span></div>
    </div>`;
  }

  /**
   * Widget de calificación en estrellas (1-5) + pastilla N/A, en reemplazo del
   * <select> plano. Los 5 radios comparten "groupName" con el radio N/A para
   * que sean mutuamente excluyentes; el relleno visual usa el truco CSS de
   * hermanos generales (~) sobre <label class="star">, ver styles.css.
   */
  function ratingWidget(groupName, valorActual, onchangeJs, disabled, compact) {
    const safeGroup = String(groupName).replace(/[^a-zA-Z0-9_-]/g, '_');
    const estrellas = [5, 4, 3, 2, 1].map((v) => {
      const id = safeGroup + '_s' + v;
      const checked = String(valorActual) === String(v);
      const descEntry = D.ESCALA.find((e) => String(e.valor) === String(v));
      const tip = descEntry ? (v + ' — ' + descEntry.descripcion) : String(v);
      return `<input type="radio" name="${safeGroup}" id="${id}" value="${v}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="${onchangeJs}"/><label class="star" for="${id}" title="${esc(tip)}">★</label>`;
    }).join('');
    const idNA = safeGroup + '_na';
    const checkedNA = String(valorActual) === 'N/A';
    const vacio = valorActual === '' || valorActual === null || valorActual === undefined;
    return `<div class="rating-widget${disabled ? ' rating-readonly' : ''}${compact ? ' rating-compact' : ''}">
      <div class="star-rating">${estrellas}</div>
      <input type="radio" class="na-radio" name="${safeGroup}" id="${idNA}" value="N/A" ${checkedNA ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="${onchangeJs}"/>
      <label class="na-pill" for="${idNA}" title="No aplica o sin elementos suficientes para evaluar">N/A</label>
      ${vacio ? '<span class="rating-empty-hint">Sin calificar</span>' : ''}
    </div>`;
  }

  function renderCompetenciaCard(evaluacionId, seccion, c, respuesta, soloLectura) {
    const valor = respuesta ? respuesta.valor : '';
    const comentario = respuesta ? respuesta.comentario : '';
    const groupName = 'rate_' + evaluacionId + '_' + c.id;
    const onchangeJs = `App.rate('${evaluacionId}','${seccion}','${c.id}',this.value)`;
    return `
    <div class="competency-card competency-card-fixed" data-competencia-id="${esc(c.id)}">
      <div class="competency-topline">
        <div class="competency-title-block"><strong>${esc(c.nombre)}</strong><span class="peso-tag">${c.peso}%</span></div>
        <div class="competency-rate competency-rate-fixed">
          <label>Calificación</label>
          ${ratingWidget(groupName, valor, onchangeJs, soloLectura, false)}
        </div>
      </div>
      <ul class="conductas conductas-below">${c.conductas.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${c.id === 'B2' ? `<details class="tools-reference"><summary>Cuadro de apoyo — herramientas y sistemas de uso general</summary><div class="tools-reference-grid"><span>Excel</span><span>Word y PowerPoint</span><span>Outlook</span><span>Teams / SharePoint / OneDrive</span><span>Concur</span><span>Sistemas internos de Inter-Con</span><span>Portales de clientes / CFDI</span><span>Power BI u otra herramienta autorizada</span></div><small>Evalúa únicamente las herramientas que apliquen al puesto; usa N/A en las demás.</small></details>` : ''}
      ${!soloLectura ? `<div class="validation-message" aria-live="polite">Selecciona una calificación para continuar.</div><textarea class="comentario-box" placeholder="Comentario (opcional)" onchange="App.comentar('${evaluacionId}','${seccion}','${c.id}',this.value)">${esc(comentario)}</textarea>` : (comentario ? `<div class="comentario-lectura">${esc(comentario)}</div>` : '')}
    </div>`;
  }

  function evaluarSmartObjetivo(o) {
    const descripcion = String(o.descripcion || '').trim();
    const meta = String(o.meta || '').trim();
    const fecha = String(o.fechaCompromiso || '').trim();
    const palabras = descripcion.split(/\s+/).filter(Boolean);
    const verbos = /\b(incrementar|reducir|disminuir|aumentar|mejorar|alcanzar|lograr|implementar|completar|mantener|desarrollar|optimizar|automatizar|entregar|cumplir|capacitar|generar|crear|fortalecer|elevar|bajar)\b/i;
    const especifico = palabras.length >= 7 && verbos.test(descripcion);
    const medible = !!meta || /\d|%|porcentaje|indicador|kpi|cantidad|número|numero|tasa|índice|indice/i.test(descripcion);
    const alcanzable = !!o.alcanzable;
    const relevante = !!o.relevante;
    const temporal = !!fecha || /\b(20\d{2}|q[1-4]|trimestre|mes|semana|antes del|a más tardar|al \d{1,2}|durante)\b/i.test(descripcion);
    const criterios = { S: especifico, M: medible, A: alcanzable, R: relevante, T: temporal };
    return { criterios, completo: Object.values(criterios).every(Boolean), total: Object.values(criterios).filter(Boolean).length };
  }

  function smartChecklistHTML(o, evaluacionId, index, soloLecturaDescripcion) {
    const smart = evaluarSmartObjetivo(o);
    const item = (k, label) => `<span class="smart-pill ${smart.criterios[k] ? 'ok' : 'pending'}"><b>${k}</b>${smart.criterios[k] ? '✓' : '•'} ${label}</span>`;
    return `<div class="smart-validator ${smart.completo ? 'smart-ok' : ''}">
      <div class="smart-validator-head"><strong>Validación SMART</strong><span>${smart.total}/5 criterios</span></div>
      <div class="smart-pills">
        ${item('S','Específico')}${item('M','Medible')}${item('A','Alcanzable')}${item('R','Relevante')}${item('T','Temporal')}
      </div>
      ${smart.completo ? '<p class="smart-status ok">✓ Este objetivo cumple con los criterios SMART.</p>' : '<p class="smart-status">Completa los criterios pendientes antes de continuar.</p>'}
      ${!soloLecturaDescripcion ? `<div class="smart-confirmations">
        <label><input type="checkbox" ${o.alcanzable ? 'checked' : ''} onchange="App.editarObjetivoSmart('${evaluacionId}',${index},'alcanzable',this.checked)"> A — Es alcanzable con los recursos y responsabilidades disponibles.</label>
        <label><input type="checkbox" ${o.relevante ? 'checked' : ''} onchange="App.editarObjetivoSmart('${evaluacionId}',${index},'relevante',this.checked)"> R — Está relacionado con las responsabilidades del puesto o prioridades del área.</label>
      </div>` : ''}
    </div>`;
  }

  // =========================================================================
  // ASISTENTE DE IA PARA OBJETIVOS SMART ("✨ Ayúdame con IA")
  // ---------------------------------------------------------------------------
  // La IA es solo un asistente de REDACCIÓN: nunca guarda, envía ni aprueba
  // nada automáticamente. El usuario siempre decide: aceptar, editar o
  // descartar. Después de aceptar, el objetivo pasa por evaluarSmartObjetivo()
  // (la validación SMART que YA EXISTE) exactamente igual que si el usuario
  // lo hubiera escrito a mano — este módulo no la reemplaza ni la duplica.
  //
  // Arquitectura: FRONTEND -> api.js (EDDApi.ai.generateSmartObjective) -> n8n
  // -> proveedor de IA -> n8n -> FRONTEND. Nunca se llama a un proveedor de
  // IA directamente ni se coloca una API key en el frontend. En modo demo no
  // hay llamada de red: se genera una propuesta simulada localmente (ver
  // generarPropuestaSimuladaIA), dejando explícito en consola que es un mock.
  // =========================================================================
  state.aiSmart = {
    open: false,
    evaluacionId: null,
    index: null,
    idea: '',
    loading: false,
    error: null,
    proposal: null,       // { objective, indicator, suggestedDeadline, smart:{...} }
    deadlineHints: {}      // { [evaluacionId+':'+index]: 'texto de plazo sugerido' } — ver requerimiento 9 del brief
  };

  const AI_IDEA_MIN = 5;
  const AI_IDEA_MAX = 500;

  Object.assign(EN, {
    '✨ Ayúdame con IA': '✨ Help me with AI',
    'Convierte tu idea en un objetivo SMART': 'Turn your idea into a SMART objective',
    'Describe brevemente qué quieres lograr. La IA te ayudará a estructurarlo; podrás editar la propuesta antes de utilizarla.': 'Briefly describe what you want to achieve. AI will help you structure it; you can edit the suggestion before using it.',
    '¿Qué quieres lograr?': 'What do you want to achieve?',
    'Ej. mejorar la capacitación del equipo': 'E.g. improve team training',
    '✨ Generar propuesta SMART': '✨ Generate SMART suggestion',
    'Generando propuesta...': 'Generating suggestion...',
    'PROPUESTA SMART': 'SMART SUGGESTION',
    'Objetivo específico': 'Specific objective',
    'Meta / indicador': 'Target / indicator',
    'Plazo sugerido': 'Suggested deadline',
    'Usar esta propuesta': 'Use this suggestion',
    'Editar': 'Edit',
    'Generar otra': 'Generate another',
    'Cancelar': 'Cancel',
    'Cerrar': 'Close',
    'La propuesta generada es una ayuda de redacción. Revisa y valida la información antes de utilizarla.': 'AI-generated suggestions are writing assistance. Review and validate the information before using them.',
    'No fue posible generar la propuesta en este momento. Puedes continuar redactando el objetivo manualmente.': "We couldn't generate a suggestion right now. You can continue writing your objective manually.",
    'Escribe al menos 5 caracteres para describir tu idea.': 'Write at least 5 characters to describe your idea.',
    'caracteres': 'characters',
    'S — Específico': 'S — Specific', 'M — Medible': 'M — Measurable', 'A — Alcanzable': 'A — Achievable',
    'R — Relevante': 'R — Relevant', 'T — Temporal': 'T — Time-bound',
    'Describe qué quieres lograr antes de generar una propuesta.': 'Describe what you want to achieve before generating a suggestion.'
  });

  function claveHintPlazo(evaluacionId, index) { return evaluacionId + ':' + index; }

  // Genera una propuesta SMART simulada (modo demo, sin backend). Determinista
  // y basada en plantillas simples a partir de la idea capturada — nunca
  // pretende ser una conexión real a un modelo de IA (ver requerimiento 19).
  function generarPropuestaSimuladaIA(idea, language) {
    const ideaLimpia = idea.trim().replace(/\.+$/, '');
    if (language === 'en') {
      return {
        objective: `Improve the current level of "${ideaLimpia}" through a measurable action plan with follow-up over the next 3 months.`,
        indicator: `Percentage of progress on "${ideaLimpia}" (baseline to be confirmed with your manager)`,
        suggestedDeadline: '3 months',
        smart: {
          specific: `Focuses on improving "${ideaLimpia}" through concrete, trackable actions.`,
          measurable: 'A percentage or indicator is suggested; confirm the exact baseline and target with your manager.',
          achievable: 'A progressive improvement with follow-up actions is proposed — validate that it is realistic with your available resources.',
          relevant: 'Contributes to the objectives of your role and area; confirm it aligns with current priorities.',
          timeBound: 'Should be achieved within the next 3 months; select the exact commitment date manually.'
        }
      };
    }
    return {
      objective: `Mejorar el nivel actual de "${ideaLimpia}" mediante un plan de acción medible con seguimiento durante los próximos 3 meses.`,
      indicator: `Porcentaje de avance de "${ideaLimpia}" (línea base por confirmar con tu líder)`,
      suggestedDeadline: '3 meses',
      smart: {
        specific: `Se enfoca en mejorar "${ideaLimpia}" mediante acciones concretas y medibles.`,
        measurable: 'Se sugiere un porcentaje o indicador; confirma la línea base y la meta exacta con tu líder.',
        achievable: 'Se plantea una mejora progresiva con acciones de seguimiento — valida que sea realista con tus recursos disponibles.',
        relevant: 'Contribuye a los objetivos de tu puesto y área; confirma que esté alineado con las prioridades actuales.',
        timeBound: 'Debe alcanzarse dentro de los próximos 3 meses; selecciona la fecha de compromiso exacta manualmente.'
      }
    };
  }

  // Orquesta demo/api sin que la vista sepa cuál corrió — ver requerimientos
  // 19-21 del brief (modo demo simulado localmente, modo api vía EDDApi.ai,
  // nunca fetch() dentro de app.js).
  function generarPropuestaSmartIA(idea, language, employeeContext) {
    if (global.APP_CONFIG.mode === 'demo') {
      console.log('[DEMO] AI SMART suggestion generated locally');
      return new Promise((resolve) => {
        setTimeout(() => resolve(generarPropuestaSimuladaIA(idea, language)), 700); // simula latencia realista del panel de carga
      });
    }
    return (async () => {
      const resp = await global.EDDApi.ai.generateSmartObjective(idea, language, employeeContext);
      if (!resp || resp.success !== true || !resp.data) {
        throw new Error((resp && resp.message) || 'Respuesta inválida del asistente de IA.');
      }
      return resp.data;
    })();
  }

  function renderAiSmartModal() {
    let host = document.getElementById('aiSmartModalHost');
    if (!state.aiSmart.open) { if (host) host.remove(); return; }
    if (!host) {
      host = document.createElement('div');
      host.id = 'aiSmartModalHost';
      document.body.appendChild(host);
    }
    const ai = state.aiSmart;
    host.innerHTML = `
    <div class="ai-smart-overlay" id="aiSmartOverlay" role="presentation">
      <div class="ai-smart-modal" role="dialog" aria-modal="true" aria-label="${esc(t('Convierte tu idea en un objetivo SMART'))}">
        <div class="ai-smart-modal-header">
          <div class="ai-smart-modal-title"><span class="ai-smart-sparkle" aria-hidden="true">✨</span>Convierte tu idea en un objetivo SMART</div>
          <button type="button" class="ai-smart-modal-close" onclick="App.cerrarAsistenteIA()" aria-label="${esc(t('Cerrar'))}">×</button>
        </div>
        <div class="ai-smart-modal-body">
          ${ai.loading ? renderAiSmartLoading() : (ai.proposal ? renderAiSmartPreview(ai.proposal) : renderAiSmartForm(ai))}
        </div>
        <p class="ai-smart-disclaimer">La propuesta generada es una ayuda de redacción. Revisa y valida la información antes de utilizarla.</p>
      </div>
    </div>`;
    translateDOM(host);
    const overlay = document.getElementById('aiSmartOverlay');
    if (overlay) overlay.addEventListener('mousedown', (ev) => { if (ev.target === overlay) Actions.cerrarAsistenteIA(); });
    const textarea = document.getElementById('aiSmartIdeaInput');
    if (textarea) { textarea.focus(); const v = textarea.value; textarea.setSelectionRange(v.length, v.length); }
  }

  function renderAiSmartForm(ai) {
    const len = (ai.idea || '').length;
    const puedeGenerar = len >= AI_IDEA_MIN && len <= AI_IDEA_MAX;
    return `
    <p class="ai-smart-intro">Describe brevemente qué quieres lograr. La IA te ayudará a estructurarlo; podrás editar la propuesta antes de utilizarla.</p>
    <div class="ai-smart-field">
      <label for="aiSmartIdeaInput">¿Qué quieres lograr?</label>
      <textarea id="aiSmartIdeaInput" maxlength="${AI_IDEA_MAX}" placeholder="${esc(t('Ej. mejorar la capacitación del equipo'))}" oninput="App.actualizarIdeaIA(this.value)">${esc(ai.idea || '')}</textarea>
      <div class="ai-smart-counter">${len}/${AI_IDEA_MAX} ${t('caracteres')}</div>
      ${ai.error ? `<p class="ai-smart-error" role="alert" aria-live="polite">⚠ ${esc(ai.error)}</p>` : ''}
    </div>
    <div class="ai-smart-actions">
      <button type="button" class="btn btn-outline" onclick="App.cerrarAsistenteIA()">Cancelar</button>
      <button type="button" class="btn btn-primary ai-smart-generate" ${puedeGenerar ? '' : 'disabled'} onclick="App.generarPropuestaIA()">✨ Generar propuesta SMART</button>
    </div>`;
  }

  function renderAiSmartLoading() {
    return `<div class="ai-smart-loading" role="status" aria-live="polite">
      <span class="ai-smart-spinner" aria-hidden="true"></span>
      <p>Generando propuesta...</p>
    </div>`;
  }

  function renderAiSmartPreview(p) {
    const smartRow = (label, text) => `<div class="ai-smart-criterion"><b>${esc(label)}</b><span>${esc(text)}</span></div>`;
    return `
    <div class="ai-smart-preview">
      <div class="ai-smart-preview-kicker">PROPUESTA SMART</div>
      <div class="ai-smart-field">
        <label for="aiSmartObjectiveInput">Objetivo específico</label>
        <textarea id="aiSmartObjectiveInput">${esc(p.objective)}</textarea>
      </div>
      <div class="ai-smart-field">
        <label for="aiSmartIndicatorInput">Meta / indicador</label>
        <textarea id="aiSmartIndicatorInput">${esc(p.indicator)}</textarea>
      </div>
      ${p.suggestedDeadline ? `<div class="ai-smart-deadline"><b>Plazo sugerido</b><span>${esc(p.suggestedDeadline)}</span></div>` : ''}
      <div class="ai-smart-criteria">
        ${smartRow(t('S — Específico'), p.smart.specific)}
        ${smartRow(t('M — Medible'), p.smart.measurable)}
        ${smartRow(t('A — Alcanzable'), p.smart.achievable)}
        ${smartRow(t('R — Relevante'), p.smart.relevant)}
        ${smartRow(t('T — Temporal'), p.smart.timeBound)}
      </div>
    </div>
    <div class="ai-smart-actions ai-smart-actions--preview">
      <button type="button" class="btn btn-outline" onclick="App.cerrarAsistenteIA()">Cancelar</button>
      <button type="button" class="btn btn-outline" onclick="App.editarPropuestaIA()">Editar</button>
      <button type="button" class="btn btn-outline" onclick="App.regenerarPropuestaIA()">Generar otra</button>
      <button type="button" class="btn btn-primary" onclick="App.usarPropuestaIA()">Usar esta propuesta</button>
    </div>`;
  }

  function objectivesAckKey(evaluacionId) { return `edd_obj_ack_rev4_${evaluacionId}`; }
  function objetivosComprendidos(evaluacionId) { return sessionStorage.getItem(objectivesAckKey(evaluacionId)) === '1'; }

  function renderObjetivosForm(ev, soloLecturaDescripcion) {
    const objetivos = S.getObjetivos(ev.id);
    const filas = [];
    const comprendido = objetivosComprendidos(ev.id);
    for (let i = 0; i < Math.max(objetivos.length, 1); i++) {
      filas.push(objetivos[i] || { index: i, descripcion: '', meta: '', resultado: '', cumplimiento: '', noCuantificable: false, calificacion: '' });
    }
    return `
    <div class="kpi-workspace kpi-workspace-stacked">
      <section class="kpi-guide-wide ${comprendido ? 'acknowledged' : ''}" aria-label="Guía de objetivos del periodo">
        <div class="kpi-guide-wide-copy">
          <div class="smart-guide-badge">OBJETIVOS DEL PERIODO · 30%</div>
          <h3>Antes de capturar, revisa cómo se califican tus objetivos</h3>
          <p>Registra hasta cinco objetivos acordados al inicio del periodo con su meta o indicador, resultado alcanzado y porcentaje de cumplimiento.</p>
          <div class="kpi-equivalence-inline">
            <span><b>5 ★</b> 110% o más</span><span><b>4 ★</b> 100–109%</span><span><b>3 ★</b> 90–99%</span><span><b>2 ★</b> 75–89%</span><span><b>1 ★</b> &lt;75%</span>
          </div>
          <small>Si un objetivo no es cuantificable, la calificación puede asignarse con evidencia documentada.</small>
        </div>
        <button type="button" class="btn ${comprendido ? 'btn-ack-done' : 'btn-primary'} kpi-understand-btn" onclick="App.comprenderObjetivos('${ev.id}')" ${comprendido ? 'disabled' : ''}>${comprendido ? '✓ Comprendido' : 'Comprendo lo que dice'}</button>
      </section>
      <section class="smart-capture-panel kpi-capture-full ${comprendido ? '' : 'kpi-capture-locked'}" aria-disabled="${comprendido ? 'false' : 'true'}">
        <div class="smart-capture-head">
          <div><span class="smart-capture-kicker">CUMPLIMIENTO DE OBJETIVOS · 30%</span><h3>Captura tus objetivos</h3><p>Objetivo, meta o indicador, resultado, porcentaje de cumplimiento y calificación.</p></div>
          <div class="smart-capture-chip">REV. 4</div>
        </div>
        ${comprendido ? '' : '<div class="kpi-lock-message">🔒 Confirma que comprendiste la guía superior para habilitar la captura.</div>'}
        <div id="objetivosWrap">${filas.map((o, i) => renderObjetivoRow(ev.id, o, Number(o.index ?? i), soloLecturaDescripcion, !comprendido)).join('')}</div>
        ${filas.length < 5 ? `<button class="btn btn-outline btn-sm smart-add-objective" ${comprendido ? '' : 'disabled'} onclick="App.agregarObjetivo('${ev.id}')">+ Agregar objetivo</button>` : ''}
      </section>
    </div>`;
  }

  function renderObjetivoRow(evaluacionId, o, index, soloLecturaDescripcion, bloqueado) {
    const groupName = 'obj_' + evaluacionId + '_' + index;
    const onchangeJs = `App.editarObjetivoKPI('${evaluacionId}',${index},'calificacion',this.value)`;
    const cumplimiento = o.cumplimiento ?? '';
    const autoScore = C.calificacionPorCumplimiento(cumplimiento);
    const disabled = !!soloLecturaDescripcion || !!bloqueado;
    return `
    <div class="objetivo-row smart-objective kpi-objective ${disabled ? 'objective-disabled' : ''}" data-idx="${index}">
      <div class="smart-objective-head">
        <div class="objetivo-num">#${index + 1}</div>
        <button class="smart-remove-objective" type="button" ${disabled ? 'disabled' : ''} onclick="App.quitarObjetivo('${evaluacionId}',${index})" aria-label="Quitar objetivo ${index + 1}" title="Quitar objetivo">× <span>Quitar</span></button>
      </div>
      <div class="objetivo-fields kpi-objective-fields">
        <div class="smart-field smart-field-objective"><label>Objetivo</label><textarea placeholder="Describe el objetivo acordado para el periodo" ${disabled ? 'disabled' : ''} oninput="App.editarObjetivoKPI('${evaluacionId}',${index},'descripcion',this.value)">${esc(o.descripcion || '')}</textarea></div>
        <div class="smart-field smart-field-meta"><label>Meta o indicador</label><input type="text" placeholder="Ej. 95% de cumplimiento / 25 contratos / ≤ 24 h" value="${esc(o.meta || '')}" ${disabled ? 'disabled' : ''} oninput="App.editarObjetivoKPI('${evaluacionId}',${index},'meta',this.value)"></div>
        <div class="smart-field"><label>Resultado obtenido</label><textarea placeholder="Describe el resultado realmente alcanzado" ${disabled ? 'disabled' : ''} oninput="App.editarObjetivoKPI('${evaluacionId}',${index},'resultado',this.value)">${esc(o.resultado || '')}</textarea></div>
        <div class="smart-field kpi-percent-field"><label>% de cumplimiento</label><input type="number" min="0" step="0.1" placeholder="Ej. 103" value="${esc(cumplimiento)}" ${disabled || o.noCuantificable ? 'disabled' : ''} onchange="App.editarObjetivoKPI('${evaluacionId}',${index},'cumplimiento',this.value)"><small>${autoScore ? `Equivale a ${autoScore} ★` : 'La calificación se calculará automáticamente.'}</small></div>
        <label class="kpi-nonquant"><input type="checkbox" ${o.noCuantificable ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="App.editarObjetivoKPI('${evaluacionId}',${index},'noCuantificable',this.checked)"> Objetivo no cuantificable; calificar con evidencia documentada.</label>
        <div class="smart-field smart-rating-field"><label>Calificación (1-5 / N/A)</label>${ratingWidget(groupName, o.calificacion, onchangeJs, disabled, true)}<small class="objective-rating-help">Si capturas un porcentaje, esta calificación se asigna automáticamente con la tabla Rev. 4.</small></div>
        <div class="validation-message" aria-live="polite">Completa objetivo, meta/indicador, resultado y una calificación válida.</div>
      </div>
    </div>`;
  }

  function renderResumenAuto(ev) {
    const secciones = ['actitud', 'habilidades'];
    const objetivos = S.getObjetivos(ev.id).filter((o) => o.descripcion && o.descripcion.trim());
    return `
    <p class="muted">Revisa tus respuestas antes de enviar. El resultado y la comparación con tu líder se mostrarán más adelante, en la fase de retroalimentación.</p>
    ${secciones.map((s) => {
      const resp = S.getRespuestasPorSeccion(ev.id)[s];
      const map = {}; resp.forEach((r) => map[r.competenciaId] = r.valor);
      return `<div class="resumen-seccion"><h4>${labelSeccion(s)}</h4><table class="table table-compact"><tbody>
        ${D.COMPETENCIAS[s].map((c) => `<tr><td>${esc(c.nombre)}</td><td class="text-right">${map[c.id] !== undefined ? esc(map[c.id]) : '<span class="muted">Sin responder</span>'}</td></tr>`).join('')}
      </tbody></table></div>`;
    }).join('')}
    <div class="resumen-seccion"><h4>C. Cumplimiento de Objetivos</h4>
      ${objetivos.length ? `<table class="table table-compact"><thead><tr><th>Objetivo</th><th>Meta</th><th>Resultado</th><th>%</th><th>Calif.</th></tr></thead><tbody>${objetivos.map((o) => `<tr><td>${esc(o.descripcion)}</td><td>${esc(o.meta || '—')}</td><td>${esc(o.resultado || '—')}</td><td>${esc(o.cumplimiento === '' || o.cumplimiento == null ? '—' : o.cumplimiento + '%')}</td><td class="text-right">${esc(o.calificacion)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No se registraron objetivos.</p>'}
    </div>
    <div class="form-group resumen-comments"><label>Comentarios u observaciones del colaborador</label><textarea placeholder="Agrega contexto adicional si lo consideras necesario. Si más de la mitad de una sección quedó en N/A, justifica aquí." onchange="App.setComentarios('${ev.id}',this.value)">${esc(ev.comentarios || '')}</textarea></div>`;
  }

  function inicialesAvatar(nombre) { return String(nombre || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase(); }

  /**
   * Ficha ejecutiva de retroalimentación del colaborador. Reutiliza los
   * campos y funciones ya existentes (resultados, calibración, áreas de
   * oportunidad, planes de desarrollo, acciones de cronograma, evidencias);
   * no se duplican entidades nuevas.
   */
  function viewRetroalimentacion(col, periodoId, estado) {
    if (estado !== D.ESTADOS.RETRO_PENDIENTE && estado !== D.ESTADOS.CERRADA) {
      return `<div class="card"><h2>Retroalimentación</h2><p class="muted">Tu retroalimentación aún no está disponible. Estado actual: ${badge(estado)}</p></div>`;
    }
    const cal = S.getCalibracion(col.empleado, periodoId);
    const liderEval = S.getEvaluacion(col.empleado, periodoId, 'lider');
    const resAuto = S.getUltimoResultadoPorOrigen(col.empleado, periodoId, 'autoevaluacion');
    const resLider = S.getUltimoResultadoPorOrigen(col.empleado, periodoId, 'lider');
    const totalFinal = cal ? cal.resultadoCalibrado : (resLider ? resLider.puntajes.total : null);
    const nivel = C.clasificarNivel(totalFinal);
    const cuad = C.asignarCuadrante(resLider ? resLider.promedios.actitud : null, resLider ? resLider.promedios.desempeno : null);
    const areas = S.getAreasOportunidad(col.empleado, periodoId);
    const planes = S.getPlanesDesarrollo(col.empleado, periodoId);
    const evidencias = S.getEvidencias(col.empleado, periodoId);
    const acciones = S.getAcciones(col.empleado, periodoId);
    const liderDirecto = S.getLider(col.liderId);
    const diferenciaGlobal = (resAuto && resLider) ? C.round1(resAuto.puntajes.total - resLider.puntajes.total) : null;
    const brechaGlobal = diferenciaGlobal !== null ? C.clasificarBrecha(diferenciaGlobal) : null;
    const promedios = resLider ? resLider.promedios : {};
    const puntajes = resLider ? resLider.puntajes : {};

    const radarHtml = global.EDDCharts.renderRadarChart({
      autoevaluacion: resAuto ? resAuto.promedios : null,
      evaluacionLider: resLider ? resLider.promedios : null,
      calibracion: (cal && cal.resultadoCalibrado !== undefined && resLider) ? { resultadoLider: resLider.puntajes.total, resultadoCalibrado: cal.resultadoCalibrado } : null
    });
    const ninaBoxHtml = global.EDDCharts.renderNineBoxIndividual({
      actitudProm: resLider ? resLider.promedios.actitud : null,
      desempenoProm: resLider ? resLider.promedios.desempeno : null,
      nombreColaborador: col.nombre
    });

    const seccionesCards = ['actitud', 'habilidades', 'objetivos'].map((s) => {
      const meta = D.SECCIONES_META[s];
      const val = puntajes[s];
      const pctVal = (val !== undefined && val !== null && meta.peso) ? (val / meta.peso) * 100 : 0;
      return `<div class="seccion-card">
        <div class="seccion-card-title">${esc(meta.titulo)} <span class="peso-tag">${meta.peso}%</span></div>
        ${progressBar(pctVal)}
        <div class="seccion-card-val">${f1(val)} de ${meta.peso} pts · promedio ${f1(promedios[s])}/5</div>
      </div>`;
    }).join('');

    return `
    <div class="card ficha-ejecutiva">
      <div class="ficha-header">
        <div class="avatar-iniciales">${esc(inicialesAvatar(col.nombre))}</div>
        <div class="ficha-datos-generales">
          <h2>${esc(col.nombre)}</h2>
          <div class="info-grid">
            <div><span class="label">N.º de empleado</span><span class="value">${esc(col.empleado)}</span></div>
            <div><span class="label">Puesto</span><span class="value">${esc(col.puesto)}</span></div>
            <div><span class="label">Área</span><span class="value">${esc(col.area)}</span></div>
            <div><span class="label">Dirección</span><span class="value">${esc(col.direccion)}</span></div>
            <div><span class="label">Ciudad operativa</span><span class="value">${esc(col.ciudad)}</span></div>
            <div><span class="label">Antigüedad</span><span class="value">${esc(col.antiguedad)}</span></div>
            <div><span class="label">Líder directo</span><span class="value">${esc(liderDirecto ? liderDirecto.nombre : '—')}</span></div>
            <div><span class="label">Periodo evaluado</span><span class="value">${esc(state.periodo.nombre)}</span></div>
          </div>
        </div>
      </div>

      <div class="resultado-final">
        <div class="resultado-num" style="color:${nivel.color}">${f1(totalFinal)}</div>
        <div>${badge(nivel.nivel, null)}<div class="muted">Puntaje final sobre 100</div></div>
      </div>
      ${progressBar(totalFinal, nivel.color)}

      <h3>Resultados por sección</h3>
      <div class="seccion-cards">${seccionesCards}</div>

      <div class="two-col">
        <div><h3>Radar comparativo</h3>${radarHtml}</div>
        <div><h3>Matriz 9-Box (tu ubicación)</h3>${ninaBoxHtml}</div>
      </div>

      <h3>Fortalezas</h3><p>${esc(liderEval ? liderEval.fortalezas : '') || '<span class="muted">Sin registrar.</span>'}</p>
      <h3>Áreas de oportunidad y plan de mejora</h3>
      ${areas.length ? `<table class="table"><thead><tr><th>Área de oportunidad</th><th>Plan de mejora</th></tr></thead><tbody>${areas.map((a) => `<tr><td>${esc(a.area)}</td><td>${esc(a.planMejora)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Sin áreas registradas.</p>'}
      <h3>Plan de desarrollo</h3>
      ${renderPlanesTabla(planes)}
      <h3>Cronograma de seguimiento (6 semanas)</h3>
      ${acciones.length ? renderGantt(acciones) : '<p class="muted">Aún no se genera cronograma.</p>'}
      <h3>Comentarios del líder</h3><p>${esc(liderEval ? liderEval.comentarios : '') || '<span class="muted">Sin comentarios.</span>'}</p>
      <h3>Observaciones de RH</h3><p>${esc(cal ? cal.observacionesRH : '') || '<span class="muted">Sin observaciones registradas.</span>'}</p>
      <h3>Evidencias</h3>
      <ul class="evidencias-list">${evidencias.map((e) => `<li>${esc(e.nombreArchivo)} <span class="muted">(${esc(e.tipo)}, ${esc(e.fecha)}, ${esc(e.usuario)})</span></li>`).join('') || '<li class="muted">Sin evidencias cargadas.</li>'}</ul>
      <div class="actions">
        <button class="btn btn-outline" onclick="App.cargarEvidencia('${col.empleado}','${periodoId}')">Simular carga de evidencia</button>
        ${estado === D.ESTADOS.RETRO_PENDIENTE ? `<button class="btn btn-primary" ${evidencias.length ? '' : 'disabled title="Carga al menos una evidencia antes de aceptar"'} onclick="App.aceptar('${col.empleado}','${periodoId}')">Aceptar resultado</button>` : badge('Resultado aceptado el ' + (cal ? cal.fechaAceptacion : ''), 'green')}
      </div>
    </div>`;
  }

  // renderCuadranteInfo vive ahora en charts.js (EDDCharts.renderCuadranteInfo)
  // para que la matriz global y la individual usen exactamente la misma tarjeta.
  function renderCuadranteInfo(cuad) { return global.EDDCharts.renderCuadranteInfo(cuad); }

  function renderPlanesTabla(planes) {
    if (!planes.length) return '<p class="muted">Sin acciones de desarrollo registradas.</p>';
    return `<table class="table"><thead><tr><th>Competencia</th><th>Acción</th><th>Responsable</th><th>Fecha compromiso</th><th>Estado</th><th>Evidencia</th></tr></thead><tbody>
      ${planes.map((p) => `<tr><td>${esc(p.competencia)}</td><td>${esc(p.accion)}</td><td>${esc(p.responsable)}</td><td>${esc(p.fechaCompromiso)}</td><td>${badge(p.estado)}</td><td>${esc(p.evidencia) || '—'}</td></tr>`).join('')}
    </tbody></table>`;
  }

  function renderGantt(acciones) {
    const semanas = [1, 2, 3, 4, 5, 6];
    return `<div class="gantt">
      <div class="gantt-header"><div class="gantt-label">Acción</div>${semanas.map((s) => `<div class="gantt-col">S${s}</div>`).join('')}<div class="gantt-col">Avance</div></div>
      ${acciones.map((a) => `<div class="gantt-row">
        <div class="gantt-label">${esc(a.accion)} <span class="muted">(${esc(a.responsable)})</span></div>
        ${semanas.map((s) => `<div class="gantt-col ${s >= a.semanaInicio && s <= a.semanaFin ? 'gantt-active gantt-' + estadoClase(a.estado) : ''}"></div>`).join('')}
        <div class="gantt-col">${badge(a.estado)} ${a.avance}%</div>
      </div>`).join('')}
    </div>`;
  }
  function estadoClase(estado) {
    return { 'No iniciada': 'gray', 'En proceso': 'yellow', 'Completada': 'green', 'Vencida': 'red' }[estado] || 'gray';
  }

  // =========================================================================
  // PORTAL LÍDER
  // =========================================================================
  function renderLider(page, param) {
    const lider = S.getLider(state.user.empleado);
    const periodoId = state.periodo.id;
    if (page === 'evaluar' && param) return viewLiderEvaluar(lider, param, periodoId);
    if (page === 'comparacion' && param) return viewComparacion(lider, param, periodoId);
    if (page === 'pendientes') return viewLiderDashboard(lider, periodoId, true);
    return viewLiderDashboard(lider, periodoId, false);
  }

  function viewLiderDashboard(lider, periodoId, soloPendientes) {
    const equipo = S.getColaboradoresDeLider(lider.empleado);
    let filas = equipo.map((c) => {
      const estado = S.estadoProceso(c.empleado, periodoId);
      const autoEval = S.getEvaluacion(c.empleado, periodoId, 'autoevaluacion');
      const liderEval = S.getEvaluacion(c.empleado, periodoId, 'lider');
      return { c, estado, autoEval, liderEval };
    });
    if (soloPendientes) filas = filas.filter((f) => f.estado === D.ESTADOS.PENDIENTE_LIDER);
    const total = filas.length;
    const completadas = filas.filter((f) => f.estado === D.ESTADOS.CERRADA).length;
    const pendientesLider = filas.filter((f) => f.estado === D.ESTADOS.PENDIENTE_LIDER).length;
    const pendientesRetro = filas.filter((f) => f.estado === D.ESTADOS.RETRO_PENDIENTE).length;
    const vencidas = filas.filter((f) => (!f.autoEval || f.autoEval.estado !== D.ESTADOS.COMPLETADA) && esVencido(state.periodo.fechaLimiteAutoevaluacion)).length
      + filas.filter((f) => f.autoEval && f.autoEval.estado === D.ESTADOS.COMPLETADA && (!f.liderEval || f.liderEval.estado !== D.ESTADOS.COMPLETADA) && esVencido(state.periodo.fechaLimiteLider)).length;
    const avance = total ? pct((completadas / total) * 100) : 0;

    return `
    <div class="kpi-grid">
      ${kpi('Colaboradores', total)}
      ${kpi('Evaluaciones pendientes (líder)', pendientesLider, vencidas ? 'red' : 'yellow')}
      ${kpi('Completadas', completadas, 'green')}
      ${kpi('Pendientes de retroalimentación', pendientesRetro, 'yellow')}
      ${kpi('Avance del equipo', avance + '%', 'blue')}
      ${kpi('Alertas por vencimiento', vencidas, vencidas ? 'red' : 'gray')}
    </div>
    <div class="card">
      <h2>${soloPendientes ? 'Pendientes por evaluar' : 'Mi equipo'} — ${esc(lider.area)}</h2>
      ${soloPendientes && !filas.length ? '<p class="alert alert-success">No tienes evaluaciones pendientes en este momento.</p>' : ''}
      <table class="table">
        <thead><tr><th>Nombre</th><th>Puesto</th><th>Área</th><th>Autoevaluación</th><th>Evaluación líder</th><th>Retroalimentación</th><th></th></tr></thead>
        <tbody>
        ${filas.map((f) => {
          const eAuto = !f.autoEval ? 'No iniciada' : f.autoEval.estado;
          const eLider = !f.liderEval ? 'No iniciada' : f.liderEval.estado;
          const eRetro = [D.ESTADOS.RETRO_PENDIENTE, D.ESTADOS.CERRADA].includes(f.estado) ? f.estado : (f.estado === D.ESTADOS.CALIBRADA ? 'Calibrada' : 'Pendiente');
          let accion = '';
          if (f.estado === D.ESTADOS.PENDIENTE_LIDER) accion = `<a class="btn btn-primary btn-sm" href="#/lider/evaluar/${f.c.empleado}">Evaluar</a>`;
          else if ([D.ESTADOS.PENDIENTE_CALIBRACION, D.ESTADOS.CALIBRADA, D.ESTADOS.RETRO_PENDIENTE, D.ESTADOS.CERRADA].includes(f.estado)) accion = `<a class="btn btn-outline btn-sm" href="#/lider/comparacion/${f.c.empleado}">Ver comparación</a>`;
          else accion = `<span class="muted">Sin acción disponible</span>`;
          return `<tr><td>${esc(f.c.nombre)}</td><td>${esc(f.c.puesto)}</td><td>${esc(f.c.area)}</td><td>${badge(eAuto)}</td><td>${badge(eLider)}</td><td>${badge(eRetro)}</td><td>${accion}</td></tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>`;
  }
  function kpi(label, value, color) {
    return `<div class="kpi-card"><div class="kpi-value ${color ? 'kpi-' + color : ''}">${value}</div><div class="kpi-label">${esc(label)}</div></div>`;
  }

  // Bloquea el acceso de un líder a colaboradores que no le reportan
  // directamente (liderId debe coincidir con el número de empleado del líder
  // en sesión). Se aplica tanto si el líder llega por navegación normal como
  // si escribe la URL con hash directamente en el navegador.
  function viewAccesoDenegado(mensaje) {
    return `<div class="card"><h2>Acceso no autorizado</h2><p class="muted">${esc(mensaje)}</p><a class="btn btn-outline" href="#/lider/dashboard">Volver a mi equipo</a></div>`;
  }
  function perteneceALider(col, lider) {
    return !!(col && lider && String(col.liderId) === String(lider.empleado));
  }

  function viewLiderEvaluar(lider, colaboradorId, periodoId) {
    const col = S.getColaborador(colaboradorId);
    if (!col || !perteneceALider(col, lider)) {
      return viewAccesoDenegado('Este colaborador no pertenece a tu equipo directo. Solo puedes evaluar a las personas cuyo líder registrado seas tú.');
    }
    const autoEval = S.getEvaluacion(colaboradorId, periodoId, 'autoevaluacion');
    if (!autoEval || autoEval.estado !== D.ESTADOS.COMPLETADA) {
      return `<div class="card"><h2>${esc(col.nombre)}</h2><p class="muted">El colaborador aún no completa su autoevaluación. No es posible iniciar la evaluación del líder todavía.</p><a class="btn btn-outline" href="#/lider/dashboard">Volver</a></div>`;
    }
    const ev = S.getOrCreateEvaluacion(colaboradorId, lider.empleado, periodoId, 'lider');
    if (ev.estado === D.ESTADOS.COMPLETADA) return viewComparacion(lider, colaboradorId, periodoId);

    if (state.wizard.evaluacionId !== ev.id) state.wizard = { seccionIdx: 0, evaluacionId: ev.id, tipo: 'lider', colaboradorId, liderId: lider.empleado };
    const idx = state.wizard.seccionIdx;
    const seccion = SECCIONES_WIZARD[idx];
    const stepsHtml = SECCIONES_WIZARD.map((s, i) => `<div class="wizard-step ${i === idx ? 'active' : ''} ${i < idx ? 'done' : ''}">${i + 1}. ${labelSeccion(s === 'resumen' ? 'resumen' : s)}</div>`).join('');

    let contenido = '';
    if (seccion === 'objetivos') contenido = renderObjetivosLider(ev, autoEval);
    else if (seccion === 'resumen') contenido = renderResumenLider(ev, col);
    else contenido = renderSeccionForm(ev, seccion, false);

    const progresoLider = Math.round(((idx + (seccion === 'resumen' ? 1 : 0)) / SECCIONES_WIZARD.length) * 100);
    const sidebarLider = SECCIONES_WIZARD.map((s, i) => `<button class="premium-section-step ${i === idx ? 'active' : ''} ${i < idx ? 'done' : ''}" type="button"><span><strong>${labelSeccion(s)}</strong><small>${s === 'resumen' ? 'Revisión final' : (D.SECCIONES_META[s] ? D.SECCIONES_META[s].eje || 'Evaluación' : '')}</small></span><b>${i < idx ? '✓' : (i + 1) + '/5'}</b></button>`).join('');
    return `
    <div class="card premium-leader-person">
      <h2>Evaluación de ${esc(col.nombre)}</h2>
      <div class="info-grid">
        <div><span class="label">Puesto</span><span class="value">${esc(col.puesto)}</span></div>
        <div><span class="label">Área</span><span class="value">${esc(col.area)}</span></div>
        <div><span class="label">Antigüedad</span><span class="value">${esc(col.antiguedad)}</span></div>
        <div><span class="label">Periodo</span><span class="value">${esc(state.periodo.nombre)}</span></div>
      </div>
      <p class="alert alert-info">La autoevaluación del colaborador permanecerá oculta hasta que envíes tu evaluación.</p>
    </div>
    <section class="premium-evaluation-page premium-leader-evaluation">
      <div class="premium-progress-head"><div><span>Progreso de evaluación</span><div class="progress"><div class="progress-bar" style="width:${progresoLider}%"></div></div></div><strong>${progresoLider}%</strong></div>
      <div class="premium-evaluation-layout">
        <aside class="premium-evaluation-sidebar">${sidebarLider}<div class="premium-reminder-card"><strong>Evaluación del líder</strong><p>Guarda tu avance y verifica cada sección antes de enviar. La autoevaluación se mostrará después del envío.</p></div>${escalaSidebarHTML()}</aside>
        <div class="premium-evaluation-main">
          <div class="premium-evaluation-title"><span class="premium-section-kicker">${seccion === 'resumen' ? 'Revisión final' : 'Sección ' + (idx + 1) + ' de 3'}</span><h1>${labelSeccion(seccion)}${seccion !== 'resumen' && D.SECCIONES_META[seccion] ? ` <em>(${D.SECCIONES_META[seccion].peso}%)</em>` : ''}</h1></div>
          ${contenido}
          <div class="wizard-nav premium-wizard-nav">
            <button class="btn btn-outline" ${idx === 0 ? 'disabled' : ''} onclick="App.wizardPrev()">← Anterior</button>
            <button class="btn btn-outline premium-save-btn" onclick="App.guardarProgresoVisual()">Guardar progreso</button>
            ${seccion === 'resumen'
              ? `<label class="confirm-check premium-confirm premium-confirm-large"><input type="checkbox" id="confirmEnvioLider"/> Confirmo que la evaluación está completa.</label><button class="btn btn-primary premium-next-btn" onclick="App.enviarEvaluacionLider('${colaboradorId}')">Enviar evaluación ✓</button>`
              : `<button class="btn btn-primary premium-next-btn" onclick="App.wizardNext('${seccion}')">Siguiente →</button>`}
          </div>
        </div>
      </div>
    </section>`;
  }

  function renderObjetivosLider(ev, autoEval) {
    const objetivosAuto = S.getObjetivos(autoEval.id).filter((o) => o.descripcion && o.descripcion.trim());
    const objetivosLider = S.getObjetivos(ev.id);
    const mapLider = {}; objetivosLider.forEach((o) => { mapLider[Number(o.index)] = o; });
    if (!objetivosAuto.length) return '<p class="muted">El colaborador no registró objetivos en este periodo.</p>';
    return `
    <p class="muted">Revisa la evidencia y califica cada objetivo del colaborador. Cuando exista porcentaje de cumplimiento, utiliza la equivalencia oficial Rev. 4.</p>
    ${objetivosAuto.map((o, i) => {
      // Conservamos el índice REAL del objetivo de la autoevaluación. Si el colaborador
      // quitó un objetivo, los índices pueden no ser consecutivos (ej. 0, 2, 3).
      // Usar el índice visual (i) hacía que el líder guardara/calificara otro registro y
      // la validación impedía continuar aunque todas las estrellas estuvieran marcadas.
      const sourceIndex = Number(o.index);
      const calif = mapLider[sourceIndex] ? mapLider[sourceIndex].calificacion : '';
      const groupName = 'objl_' + ev.id + '_' + sourceIndex;
      const onchangeJs = `App.editarObjetivoLider('${ev.id}',${sourceIndex},this.value)`;
      return `<div class="objetivo-row" data-idx="${sourceIndex}">
        <div class="objetivo-num">#${i + 1}</div>
        <div class="objetivo-fields">
          <div class="objetivo-lectura"><strong>Objetivo:</strong> ${esc(o.descripcion)}</div>
          <div class="objetivo-lectura"><strong>Meta / indicador:</strong> ${esc(o.meta || '—')}</div><div class="objetivo-lectura"><strong>Resultado:</strong> ${esc(o.resultado)}</div><div class="objetivo-lectura"><strong>% cumplimiento:</strong> ${esc(o.cumplimiento === '' || o.cumplimiento == null ? '—' : o.cumplimiento + '%')}</div>
          ${ratingWidget(groupName, calif, onchangeJs, false, true)}
          <div class="validation-message" aria-live="polite">Selecciona una calificación para continuar.</div>
        </div>
      </div>`;
    }).join('')}`;
  }

  function renderResumenLider(ev, col) {
    return `
    <p class="muted">Registra retroalimentación cualitativa. Estos campos se mostrarán al colaborador cuando RH habilite la fase de retroalimentación.</p>
    <div class="form-group"><label>Fortalezas del colaborador</label><textarea onchange="App.setFortalezas('${ev.id}',this.value)">${esc(ev.fortalezas)}</textarea></div>
    <div class="form-group"><label>Comentarios generales</label><textarea onchange="App.setComentarios('${ev.id}',this.value)">${esc(ev.comentarios)}</textarea></div>
    <h4>Áreas de oportunidad y plan de mejora</h4>
    <div id="areasWrap">${renderAreasEditable(col.empleado, state.periodo.id)}</div>
    <button class="btn btn-outline btn-sm" onclick="App.agregarAreaOportunidad('${col.empleado}')">+ Agregar área de oportunidad</button>
    <h4>Plan de desarrollo</h4>
    <div id="planesWrap">${renderPlanesEditable(col.empleado, state.periodo.id, col.liderId)}</div>
    <button class="btn btn-outline btn-sm" onclick="App.agregarPlanDesarrollo('${col.empleado}','${col.liderId}')">+ Agregar acción de desarrollo</button>
    `;
  }

  function renderAreasEditable(colaboradorId, periodoId) {
    const areas = S.getAreasOportunidad(colaboradorId, periodoId);
    if (!areas.length) return '<p class="muted">Sin áreas registradas todavía.</p>';
    return `<table class="table table-compact"><thead><tr><th>Área de oportunidad</th><th>Plan de mejora</th><th></th></tr></thead><tbody>
      ${areas.map((a) => `<tr><td>${esc(a.area)}</td><td>${esc(a.planMejora)}</td><td><button class="btn btn-outline btn-sm" onclick="App.quitarAreaOportunidad('${a.id}','${colaboradorId}')">Quitar</button></td></tr>`).join('')}
    </tbody></table>`;
  }
  function renderPlanesEditable(colaboradorId, periodoId) {
    const planes = S.getPlanesDesarrollo(colaboradorId, periodoId);
    if (!planes.length) return '<p class="muted">Sin acciones registradas todavía.</p>';
    return `<table class="table table-compact"><thead><tr><th>Competencia</th><th>Acción</th><th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>
      ${planes.map((p) => `<tr><td>${esc(p.competencia)}</td><td>${esc(p.accion)}</td><td>${esc(p.fechaCompromiso)}</td><td>${badge(p.estado)}</td><td><button class="btn btn-outline btn-sm" onclick="App.quitarPlanDesarrollo('${p.id}','${colaboradorId}')">Quitar</button></td></tr>`).join('')}
    </tbody></table>`;
  }

  function viewComparacion(lider, colaboradorId, periodoId) {
    const col = S.getColaborador(colaboradorId);
    if (!col || !perteneceALider(col, lider)) {
      return viewAccesoDenegado('Este colaborador no pertenece a tu equipo directo. Solo puedes consultar la comparación de las personas cuyo líder registrado seas tú.');
    }
    const autoEval = S.getEvaluacion(colaboradorId, periodoId, 'autoevaluacion');
    const liderEval = S.getEvaluacion(colaboradorId, periodoId, 'lider');
    if (!autoEval || !liderEval || autoEval.estado !== D.ESTADOS.COMPLETADA || liderEval.estado !== D.ESTADOS.COMPLETADA) {
      return `<div class="card"><h2>Comparación</h2><p class="muted">Ambas evaluaciones deben estar completas para ver la comparación.</p></div>`;
    }
    const respAuto = S.getRespuestasPorSeccion(autoEval.id);
    const respLider = S.getRespuestasPorSeccion(liderEval.id);
    const filas = [];
    ['actitud', 'habilidades'].forEach((sec) => {
      D.COMPETENCIAS[sec].forEach((c) => {
        const ra = respAuto[sec].find((r) => r.competenciaId === c.id);
        const rl = respLider[sec].find((r) => r.competenciaId === c.id);
        filas.push({ nombre: c.nombre, auto: ra ? ra.valor : null, lider: rl ? rl.valor : null, comentarioLider: rl ? rl.comentario : '', comentarioAuto: ra ? ra.comentario : '' });
      });
    });
    const objAuto = S.getObjetivos(autoEval.id).filter((o) => o.descripcion && o.descripcion.trim());
    const objLider = S.getObjetivos(liderEval.id);
    const avgObjAuto = C.promedioValido(objAuto.map((o) => o.calificacion));
    const avgObjLider = C.promedioValido(objLider.map((o) => o.calificacion));
    filas.push({ nombre: 'D. Cumplimiento de Objetivos (promedio)', auto: avgObjAuto !== null ? C.round1(avgObjAuto) : 'N/A', lider: avgObjLider !== null ? C.round1(avgObjLider) : 'N/A', comentarioLider: '', comentarioAuto: '' });

    const resAuto = S.getUltimoResultadoPorOrigen(colaboradorId, periodoId, 'autoevaluacion');
    const resLider = S.getUltimoResultadoPorOrigen(colaboradorId, periodoId, 'lider');
    const cuad = C.asignarCuadrante(resLider.promedios.actitud, resLider.promedios.desempeno);
    const estado = S.estadoProceso(colaboradorId, periodoId);
    const cal = S.getCalibracion(colaboradorId, periodoId);
    const brechaGeneral = C.clasificarBrecha(resAuto.puntajes.total - resLider.puntajes.total);

    const radarHtml = global.EDDCharts.renderRadarChart({
      autoevaluacion: resAuto.promedios,
      evaluacionLider: resLider.promedios,
      calibracion: (cal && cal.resultadoCalibrado !== undefined) ? { resultadoLider: resLider.puntajes.total, resultadoCalibrado: cal.resultadoCalibrado } : null
    });
    const ninaBoxHtml = global.EDDCharts.renderNineBoxIndividual({
      actitudProm: resLider.promedios.actitud, desempenoProm: resLider.promedios.desempeno, nombreColaborador: col.nombre
    });

    return `
    <div class="card">
      <h2>Comparación — ${esc(col.nombre)}</h2>
      <div class="kpi-grid kpi-grid-3">
        ${kpi('Puntaje autoevaluación', f1(resAuto.puntajes.total))}
        ${kpi('Puntaje evaluación líder', f1(resLider.puntajes.total))}
        ${kpi('Diferencia global', (resAuto.puntajes.total - resLider.puntajes.total > 0 ? '+' : '') + f1(resAuto.puntajes.total - resLider.puntajes.total))}
      </div>
      <p>Brecha general: ${badge(brechaGeneral.etiqueta, brechaGeneral.etiqueta === 'Alineada' ? 'green' : (brechaGeneral.etiqueta === 'Revisar' ? 'yellow' : 'red'))}</p>
      <h3>Diferencias por sección (radar comparativo)</h3>
      ${radarHtml}
      <h3>Diferencias detalladas por competencia</h3>
      <table class="table">
        <thead><tr><th>Competencia</th><th>Autoevaluación</th><th>Evaluación líder</th><th>Diferencia</th><th>Brecha</th><th>Comentario líder</th><th>Comentario colaborador</th></tr></thead>
        <tbody>
        ${filas.map((f) => {
          const na = f.auto === 'N/A' || f.lider === 'N/A' || f.auto === null || f.lider === null;
          const diff = na ? null : (Number(f.lider) - Number(f.auto));
          const brecha = na ? { etiqueta: 'Sin datos', color: '#6c757d' } : C.clasificarBrecha(diff);
          const rowClass = na ? '' : (diff > 0 ? 'row-lider-mayor' : (diff < 0 ? 'row-auto-mayor' : ''));
          const destacar = !na && brecha.etiqueta === 'Brecha significativa' ? ' row-brecha-critica' : '';
          return `<tr class="${rowClass}${destacar}"><td>${esc(f.nombre)}</td><td>${esc(f.auto)}</td><td>${esc(f.lider)}</td><td>${na ? '—' : (diff > 0 ? '+' : '') + f1(diff)}</td><td>${badge(brecha.etiqueta, brecha.etiqueta === 'Alineada' ? 'green' : (brecha.etiqueta === 'Revisar' ? 'yellow' : (brecha.etiqueta === 'Sin datos' ? 'gray' : 'red')))}</td><td>${esc(f.comentarioLider)}</td><td>${esc(f.comentarioAuto)}</td></tr>`;
        }).join('')}
        </tbody>
      </table>
      <h3>Ubicación en la Matriz 9-Box</h3>
      ${ninaBoxHtml}
      <p class="muted">Estado actual del proceso: ${badge(estado)}. La calibración y liberación de retroalimentación las gestiona el administrador de RH.</p>
    </div>`;
  }

  // =========================================================================
  // PORTAL ADMINISTRADOR
  // =========================================================================
  function renderAdmin(page, param) {
    const periodoId = state.periodo.id;
    if (page === 'calibracion') return param ? viewCalibracionDetalle(param, periodoId) : viewCalibracionLista(periodoId);
    if (page === '9box') return view9BoxAdmin(periodoId);
    if (page === 'usuarios') return viewAdminUsuarios();
    if (page === 'jerarquias') return viewAdminJerarquias(periodoId);
    if (page === 'auditoria') return viewAuditoria();
    if (page === 'config') return viewConfig();
    return viewAdminDashboard(periodoId);
  }

  // =========================================================================
  // ADMIN — USUARIOS (consulta, beta 3 — preparación Excel maestro/Airtable)
  // =========================================================================
  function todosLosUsuariosCompletos() {
    const colaboradores = S.getTodosColaboradores().map((c) => Object.assign({ rolPlataforma: 'Colaborador' }, c));
    const lideres = S.getTodosLideres().map((l) => Object.assign({ rolPlataforma: 'Líder' }, l));
    const administradores = S.getTodosAdministradores().map((a) => Object.assign({ rolPlataforma: 'Administrador' }, a));
    return colaboradores.concat(lideres, administradores);
  }
  function nombreLiderDe(liderId) {
    if (!liderId) return null;
    const l = S.getLider(liderId);
    return l ? l.nombre : liderId;
  }

  function viewAdminUsuarios() {
    const filtros = state.usuariosFiltros;
    const todos = todosLosUsuariosCompletos();
    const areas = Array.from(new Set(todos.map((u) => u.area).filter(Boolean))).sort();
    const filtrados = todos.filter((u) => {
      if (filtros.area && u.area !== filtros.area) return false;
      if (filtros.rol && u.rolPlataforma !== filtros.rol) return false;
      if (filtros.estatus && u.estatusEmpleado !== filtros.estatus) return false;
      if (filtros.lider === 'con' && !u.liderId) return false;
      if (filtros.lider === 'sin' && (u.liderId || u.rolPlataforma !== 'Colaborador')) return false;
      if (filtros.correo === 'con' && !u.correoCorporativo) return false;
      if (filtros.correo === 'sin' && u.correoCorporativo) return false;
      return true;
    });

    return `
    <div class="card">
      <h2>Usuarios</h2>
      <p class="muted">Vista de solo consulta. Origen previsto: Excel maestro de usuarios sincronizado a Airtable vía n8n (tabla <code>Empleados</code>, ver README). Aún no se implementa edición masiva ni importación directa desde el navegador (ver requerimiento 17 del brief).</p>
      <div class="filters-bar">
        <select onchange="App.setFiltroUsuarios('area', this.value)"><option value="">Todas las áreas</option>${areas.map((a) => `<option value="${esc(a)}" ${filtros.area === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>
        <select onchange="App.setFiltroUsuarios('rol', this.value)"><option value="">Todos los roles</option><option ${filtros.rol === 'Colaborador' ? 'selected' : ''}>Colaborador</option><option ${filtros.rol === 'Líder' ? 'selected' : ''}>Líder</option><option ${filtros.rol === 'Administrador' ? 'selected' : ''}>Administrador</option></select>
        <select onchange="App.setFiltroUsuarios('estatus', this.value)"><option value="">Todos los estatus</option><option ${filtros.estatus === 'Activo' ? 'selected' : ''}>Activo</option><option ${filtros.estatus === 'Inactivo' ? 'selected' : ''}>Inactivo</option></select>
        <select onchange="App.setFiltroUsuarios('lider', this.value)"><option value="">Con/sin líder (todos)</option><option value="con" ${filtros.lider === 'con' ? 'selected' : ''}>Con líder</option><option value="sin" ${filtros.lider === 'sin' ? 'selected' : ''}>Sin líder</option></select>
        <select onchange="App.setFiltroUsuarios('correo', this.value)"><option value="">Con/sin correo (todos)</option><option value="con" ${filtros.correo === 'con' ? 'selected' : ''}>Con correo</option><option value="sin" ${filtros.correo === 'sin' ? 'selected' : ''}>Sin correo</option></select>
        <button class="btn btn-outline btn-sm" onclick="App.limpiarFiltrosUsuarios()">Limpiar filtros</button>
      </div>
      <table class="table">
        <thead><tr><th>No. empleado</th><th>Nombre</th><th>Correo</th><th>Puesto</th><th>Área</th><th>Rol</th><th>Estatus</th><th>Líder asignado</th><th>Correo validado</th><th>Última actualización</th></tr></thead>
        <tbody>
        ${filtrados.map((u) => `<tr class="${(u.rolPlataforma === 'Colaborador' && !u.liderId) ? 'row-sin-lider' : ''}">
          <td>${esc(u.empleado)}</td>
          <td>${esc(u.nombre)}</td>
          <td>${u.correoCorporativo ? esc(A.maskEmail(u.correoCorporativo)) : '<span class="muted">Sin correo</span>'}</td>
          <td>${esc(u.puesto)}</td>
          <td>${esc(u.area)}</td>
          <td>${esc(u.rolPlataforma)}</td>
          <td>${badge(u.estatusEmpleado || '—', u.estatusEmpleado === 'Activo' ? 'green' : 'gray')}</td>
          <td>${u.rolPlataforma === 'Colaborador' ? (u.liderId ? esc(nombreLiderDe(u.liderId)) : badge('Sin líder asignado', 'red')) : '<span class="muted">N/A</span>'}</td>
          <td>${u.correoValidado ? badge('Validado', 'green') : badge('Pendiente', 'yellow')}</td>
          <td>${esc(u.ultimaActualizacion || '—')}</td>
        </tr>`).join('') || `<tr><td colspan="10" class="muted">Sin resultados para los filtros aplicados.</td></tr>`}
        </tbody>
      </table>
      <p class="muted">${filtrados.length} de ${todos.length} usuarios.</p>
    </div>`;
  }

  // =========================================================================
  // ADMIN — JERARQUÍAS (consulta, beta 3)
  // =========================================================================
  function viewAdminJerarquias(periodoId) {
    const filtros = state.jerarquiasFiltros;
    const jerarquias = S.getJerarquias();
    const filas = jerarquias.map((j) => {
      const col = S.getColaborador(j.numeroEmpleado);
      const lider = j.numeroLider ? S.getLider(j.numeroLider) : null;
      return { j, col, lider };
    }).filter((f) => f.col);
    const sinLider = filas.filter((f) => !f.j.numeroLider);

    const filtradas = filas.filter((f) => {
      if (filtros.estado === 'con' && !f.j.numeroLider) return false;
      if (filtros.estado === 'sin' && f.j.numeroLider) return false;
      if (filtros.periodo && f.j.periodo !== filtros.periodo) return false;
      return true;
    });
    const periodos = Array.from(new Set(jerarquias.map((j) => j.periodo)));

    return `
    <div class="card">
      <h2>Jerarquías</h2>
      <p class="muted">Origen previsto: tabla <code>Asignaciones</code> del Excel maestro sincronizada a Airtable vía n8n. Las relaciones siempre usan <code>numeroEmpleado</code>/<code>numeroLider</code>, nunca el nombre (ver requerimiento 8 del brief).</p>
      <div class="kpi-grid kpi-grid-3">
        ${kpi('Asignaciones totales', filas.length)}
        ${kpi('Con líder asignado', filas.length - sinLider.length, 'green')}
        ${kpi('Sin líder asignado', sinLider.length, sinLider.length ? 'red' : 'gray')}
      </div>
      <div class="filters-bar">
        <select onchange="App.setFiltroJerarquias('estado', this.value)"><option value="">Con/sin líder (todos)</option><option value="con" ${filtros.estado === 'con' ? 'selected' : ''}>Con líder</option><option value="sin" ${filtros.estado === 'sin' ? 'selected' : ''}>Sin líder</option></select>
        <select onchange="App.setFiltroJerarquias('periodo', this.value)"><option value="">Todos los periodos</option>${periodos.map((p) => `<option value="${esc(p)}" ${filtros.periodo === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
        <button class="btn btn-outline btn-sm" onclick="App.limpiarFiltrosJerarquias()">Limpiar filtros</button>
      </div>
      <table class="table">
        <thead><tr><th>Asignación</th><th>Colaborador</th><th>Líder asignado</th><th>Periodo</th><th>Tipo</th><th>Vigencia</th><th>Estado</th></tr></thead>
        <tbody>
        ${filtradas.map((f) => `<tr class="${!f.j.numeroLider ? 'row-sin-lider' : ''}">
          <td>${esc(f.j.idAsignacion)}</td>
          <td>${esc(f.col.nombre)} <span class="muted">(${esc(f.j.numeroEmpleado)})</span></td>
          <td>${f.lider ? esc(f.lider.nombre) + ' <span class="muted">(' + esc(f.j.numeroLider) + ')</span>' : badge('Sin líder asignado', 'red')}</td>
          <td>${esc(f.j.periodo)}</td>
          <td>${esc(f.j.tipoAsignacion)}</td>
          <td>${esc(f.j.fechaInicio)} — ${f.j.fechaFin ? esc(f.j.fechaFin) : 'vigente'}</td>
          <td>${badge(f.j.asignacionActiva ? 'Activa' : 'Inactiva', f.j.asignacionActiva ? 'green' : 'gray')}</td>
        </tr>`).join('') || `<tr><td colspan="7" class="muted">Sin resultados para los filtros aplicados.</td></tr>`}
        </tbody>
      </table>
      ${sinLider.length ? `<p class="alert alert-warning">${sinLider.length} colaborador(es) no tienen líder asignado y por lo tanto no pueden avanzar en el flujo de evaluación del líder hasta que se asigne uno en el Excel maestro.</p>` : ''}
    </div>`;
  }

  function datosGlobales(periodoId) {
    const colaboradores = S.getTodosColaboradores();
    return colaboradores.map((c) => {
      const estado = S.estadoProceso(c.empleado, periodoId);
      const resLider = S.getUltimoResultadoPorOrigen(c.empleado, periodoId, 'lider');
      const cal = S.getCalibracion(c.empleado, periodoId);
      const totalFinal = cal ? cal.resultadoCalibrado : (resLider ? resLider.puntajes.total : null);
      const nivel = C.clasificarNivel(totalFinal);
      const cuad = resLider ? C.asignarCuadrante(resLider.promedios.actitud, resLider.promedios.desempeno) : { cuadrante: null, info: null };
      return { c, estado, totalFinal, nivel, cuad, promedios: resLider ? resLider.promedios : null };
    });
  }

  function viewAdminDashboard(periodoId) {
    const datos = datosGlobales(periodoId);
    const total = datos.length;
    const autoCompletadas = datos.filter((d) => S.getEvaluacion(d.c.empleado, periodoId, 'autoevaluacion') && S.getEvaluacion(d.c.empleado, periodoId, 'autoevaluacion').estado === D.ESTADOS.COMPLETADA).length;
    const liderCompletadas = datos.filter((d) => S.getEvaluacion(d.c.empleado, periodoId, 'lider') && S.getEvaluacion(d.c.empleado, periodoId, 'lider').estado === D.ESTADOS.COMPLETADA).length;
    const calibradas = datos.filter((d) => S.getCalibracion(d.c.empleado, periodoId)).length;
    const cerradas = datos.filter((d) => d.estado === D.ESTADOS.CERRADA).length;
    const pendientesCal = datos.filter((d) => d.estado === D.ESTADOS.PENDIENTE_CALIBRACION).length;
    const vencidas = datos.filter((d) => {
      const auto = S.getEvaluacion(d.c.empleado, periodoId, 'autoevaluacion');
      return (!auto || auto.estado !== D.ESTADOS.COMPLETADA) && esVencido(state.periodo.fechaLimiteAutoevaluacion);
    }).length;
    const avanceNacional = total ? pct((cerradas / total) * 100) : 0;
    const promedios = datos.filter((d) => d.totalFinal !== null).map((d) => d.totalFinal);
    const promedioGeneral = promedios.length ? promedios.reduce((a, b) => a + b, 0) / promedios.length : null;

    const filtros = state.adminFiltros;
    const areas = [...new Set(datos.map((d) => d.c.area))];
    const filtrados = datos.filter((d) => (!filtros.area || d.c.area === filtros.area) && (!filtros.estado || d.estado === filtros.estado) && (!filtros.cuadrante || String(d.cuad.cuadrante) === filtros.cuadrante));

    const avancePorArea = areas.map((a) => {
      const arr = datos.filter((d) => d.c.area === a);
      const cerr = arr.filter((d) => d.estado === D.ESTADOS.CERRADA).length;
      return { area: a, pct: arr.length ? pct((cerr / arr.length) * 100) : 0, total: arr.length };
    });

    const nivelesCount = {};
    D.REFERENCIA_NIVELES.forEach((n) => nivelesCount[n.nivel] = 0);
    datos.forEach((d) => { if (d.totalFinal !== null) nivelesCount[d.nivel.nivel] = (nivelesCount[d.nivel.nivel] || 0) + 1; });

    const cuadranteCount = {}; for (let i = 1; i <= 9; i++) cuadranteCount[i] = 0;
    datos.forEach((d) => { if (d.cuad.cuadrante) cuadranteCount[d.cuad.cuadrante]++; });
    const ranking = avancePorArea.slice().sort((a, b) => a.pct - b.pct);

    return `
    <section class="admin-premium-shell">
      <div class="admin-premium-hero">
        <div>
          <span class="admin-kicker">PANEL RH · ${esc(periodoId)}</span>
          <h1>Evaluación de Desempeño</h1>
          <p>Seguimiento nacional, calibración, cierre y distribución de talento en un solo lugar.</p>
        </div>
        <div class="admin-hero-progress">
          <div class="admin-progress-value">${avanceNacional}%</div>
          <div><strong>Avance del ciclo</strong><span>${cerradas} de ${total} evaluaciones cerradas</span></div>
        </div>
      </div>

      <div class="admin-kpi-grid">
        <div class="admin-kpi-card"><span>Personal a evaluar</span><strong>${total}</strong><small>Universo del periodo</small></div>
        <div class="admin-kpi-card"><span>Autoevaluaciones</span><strong>${autoCompletadas}</strong><small>${total ? pct(autoCompletadas/total*100) : 0}% completadas</small></div>
        <div class="admin-kpi-card"><span>Evaluaciones líder</span><strong>${liderCompletadas}</strong><small>${total ? pct(liderCompletadas/total*100) : 0}% completadas</small></div>
        <div class="admin-kpi-card attention"><span>Por calibrar</span><strong>${pendientesCal}</strong><small>Requieren revisión RH</small></div>
        <div class="admin-kpi-card success"><span>Calibradas</span><strong>${calibradas}</strong><small>Con resultado RH</small></div>
        <div class="admin-kpi-card"><span>Promedio general</span><strong>${f1(promedioGeneral)}</strong><small>Resultado disponible</small></div>
      </div>

      <div class="admin-dashboard-grid">
        <article class="admin-panel admin-panel-wide">
          <div class="admin-panel-head"><div><span class="admin-section-kicker">COBERTURA</span><h2>Avance por área</h2></div><span class="admin-panel-note">Cierre del proceso</span></div>
          <div class="admin-area-progress">
            ${avancePorArea.map((a) => `<div class="admin-area-row"><div><strong>${esc(a.area)}</strong><span>${a.total} colaboradores</span></div><div class="admin-area-track"><i style="width:${a.pct}%"></i></div><b>${a.pct}%</b></div>`).join('')}
          </div>
        </article>

        <article class="admin-panel">
          <div class="admin-panel-head"><div><span class="admin-section-kicker">RESULTADOS</span><h2>Niveles de desempeño</h2></div></div>
          <div class="admin-distribution-list">
            ${Object.keys(nivelesCount).map((n) => `<div><span>${esc(n)}</span><strong>${nivelesCount[n]}</strong><i style="width:${total ? (nivelesCount[n]/total)*100 : 0}%"></i></div>`).join('')}
          </div>
        </article>

        <article class="admin-panel">
          <div class="admin-panel-head"><div><span class="admin-section-kicker">TALENTO</span><h2>Distribución 9-Box</h2></div><a href="#/admin/9box" class="admin-text-link">Abrir matriz →</a></div>
          <div class="admin-nine-mini">
            ${Object.keys(cuadranteCount).map((n) => `<div title="${esc(C.CUADRANTES_INFO[n].nombre)}"><span>${n}</span><b>${cuadranteCount[n]}</b><small>${esc(C.CUADRANTES_INFO[n].nombre)}</small></div>`).join('')}
          </div>
        </article>
      </div>

      <article class="admin-panel admin-pending-panel">
        <div class="admin-panel-head"><div><span class="admin-section-kicker">OPERACIÓN RH</span><h2>Seguimiento de evaluaciones</h2></div><span class="admin-panel-note">${filtrados.length} registros</span></div>
        <div class="filters-bar admin-filters">
          <select onchange="App.setFiltroAdmin('area', this.value)"><option value="">Todas las áreas</option>${areas.map((a) => `<option value="${a}" ${filtros.area === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
          <select onchange="App.setFiltroAdmin('estado', this.value)"><option value="">Todos los estados</option>${Object.values(D.ESTADOS).map((e) => `<option value="${e}" ${filtros.estado === e ? 'selected' : ''}>${e}</option>`).join('')}</select>
          <select onchange="App.setFiltroAdmin('cuadrante', this.value)"><option value="">Todos los cuadrantes</option>${[1,2,3,4,5,6,7,8,9].map((n) => `<option value="${n}" ${filtros.cuadrante === String(n) ? 'selected' : ''}>${n}. ${C.CUADRANTES_INFO[n].nombre}</option>`).join('')}</select>
          <button class="btn btn-outline btn-sm" onclick="App.limpiarFiltrosAdmin()">Limpiar</button>
        </div>
        <div class="admin-table-wrap"><table class="table admin-table"><thead><tr><th>Colaborador</th><th>Área</th><th>Líder</th><th>Estado</th><th>Puntaje</th><th>9-Box</th><th></th></tr></thead><tbody>
        ${filtrados.map((d) => {
          const lider = S.getLider(d.c.liderId);
          let accion = '';
          if ([D.ESTADOS.PENDIENTE_CALIBRACION,D.ESTADOS.CALIBRADA,D.ESTADOS.RETRO_PENDIENTE].includes(d.estado)) accion = `<a class="btn btn-primary btn-sm" href="#/admin/calibracion/${d.c.empleado}">Revisar</a>`;
          return `<tr><td><strong>${esc(d.c.nombre)}</strong><small>${esc(d.c.puesto || '')}</small></td><td>${esc(d.c.area)}</td><td>${esc(lider ? lider.nombre : '—')}</td><td>${badge(d.estado)}</td><td><b>${f1(d.totalFinal)}</b></td><td>${d.cuad.cuadrante ? `<span class="admin-box-pill">${d.cuad.cuadrante} · ${esc(d.cuad.info.nombre)}</span>` : '—'}</td><td>${accion}</td></tr>`;
        }).join('')}
        </tbody></table></div>
      </article>

      <div class="admin-bottom-grid">
        <article class="admin-panel"><div class="admin-panel-head"><div><span class="admin-section-kicker">PRIORIDAD</span><h2>Áreas con mayor rezago</h2></div></div><ol class="admin-ranking">${ranking.slice(0,6).map((r,i)=>`<li><span>${i+1}</span><div><strong>${esc(r.area)}</strong><small>${r.total} personas</small></div><b>${r.pct}%</b></li>`).join('')}</ol></article>
        <article class="admin-panel"><div class="admin-panel-head"><div><span class="admin-section-kicker">ALERTAS</span><h2>Atención requerida</h2></div></div><div class="admin-alert-stack">${vencidas ? `<div class="admin-alert danger"><b>${vencidas}</b><span>autoevaluaciones vencidas</span></div>` : ''}${pendientesCal ? `<div class="admin-alert warning"><b>${pendientesCal}</b><span>evaluaciones esperando calibración</span></div>` : ''}${!vencidas&&!pendientesCal ? '<div class="admin-alert success"><b>✓</b><span>Sin alertas activas</span></div>' : ''}</div></article>
      </div>
    </section>`;
  }

  function viewCalibracionLista(periodoId) {
    const datos = datosGlobales(periodoId).filter((d) => [D.ESTADOS.PENDIENTE_CALIBRACION, D.ESTADOS.CALIBRADA, D.ESTADOS.RETRO_PENDIENTE, D.ESTADOS.CERRADA].includes(d.estado));
    const porCalibrar = datos.filter((d) => d.estado === D.ESTADOS.PENDIENTE_CALIBRACION).length;
    const calibradas = datos.filter((d) => S.getCalibracion(d.c.empleado, periodoId)).length;
    return `<section class="calibration-shell">
      <div class="calibration-list-hero"><div><span class="admin-kicker">CALIBRACIÓN RH</span><h1>Revisión y calibración</h1><p>Contrasta autoevaluación, evaluación del líder y contexto del colaborador antes de liberar resultados.</p></div><div class="calibration-list-stats"><div><strong>${porCalibrar}</strong><span>Por revisar</span></div><div><strong>${calibradas}</strong><span>Calibradas</span></div></div></div>
      <div class="calibration-card-list">
      ${datos.map((d) => { const lider=S.getLider(d.c.liderId); const cal=S.getCalibracion(d.c.empleado,periodoId); return `<article class="calibration-person-card"><div class="calibration-avatar">${esc(d.c.nombre).split(' ').slice(0,2).map(x=>x[0]).join('')}</div><div class="calibration-person-main"><div class="calibration-person-title"><strong>${esc(d.c.nombre)}</strong>${badge(d.estado)}</div><span>${esc(d.c.puesto||'')} · ${esc(d.c.area)}</span><small>Líder: ${esc(lider?lider.nombre:'—')}</small></div><div class="calibration-score"><span>Resultado</span><strong>${f1(d.totalFinal)}</strong><small>${cal&&cal.resultadoCalibrado!==undefined?'Calibrado':'Líder'}</small></div><a class="btn btn-primary btn-sm" href="#/admin/calibracion/${d.c.empleado}">${cal?'Revisar':'Calibrar'}</a></article>`; }).join('') || '<div class="admin-empty-state">No hay evaluaciones disponibles para calibración.</div>'}
      </div>
    </section>`;
  }

  function viewCalibracionDetalle(colaboradorId, periodoId) {
    const col = S.getColaborador(colaboradorId);
    const resAuto = S.getUltimoResultadoPorOrigen(colaboradorId, periodoId, 'autoevaluacion');
    const resLider = S.getUltimoResultadoPorOrigen(colaboradorId, periodoId, 'lider');
    if (!resAuto || !resLider) return `<div class="card"><h2>${esc(col.nombre)}</h2><p class="muted">Aún no existen ambas evaluaciones completas para calibrar.</p></div>`;
    const cal = S.getCalibracion(colaboradorId, periodoId) || { ajuste: 0, justificacion: '', actas: 0, nom035: '', observacionesRH: '', retroHabilitada: false, aceptacionColaborador: false, historial: [] };
    const diferencia = C.round1(resAuto.puntajes.total - resLider.puntajes.total);
    const brechaGeneral = C.clasificarBrecha(diferencia);
    const planes = S.getPlanesDesarrollo(colaboradorId, periodoId);
    const liderDirecto = S.getLider(col.liderId);
    const radarHtml = global.EDDCharts.renderRadarChart({autoevaluacion: resAuto.promedios,evaluacionLider: resLider.promedios,calibracion: (cal.resultadoCalibrado !== undefined) ? { resultadoLider: resLider.puntajes.total, resultadoCalibrado: cal.resultadoCalibrado } : null});
    const ninaBoxHtml = global.EDDCharts.renderNineBoxIndividual({actitudProm: resLider.promedios.actitud, desempenoProm: resLider.promedios.desempeno, nombreColaborador: col.nombre});
    const iniciales = esc(col.nombre).split(' ').slice(0,2).map(x=>x[0]).join('');
    const resultadoActual = cal.resultadoCalibrado !== undefined ? cal.resultadoCalibrado : resLider.puntajes.total;

    return `<section class="calibration-shell calibration-detail-shell">
      <a href="#/admin/calibracion" class="calibration-back">← Volver a calibración</a>
      <div class="calibration-profile-hero">
        <div class="calibration-avatar large">${iniciales}</div>
        <div class="calibration-profile-copy"><span class="admin-kicker">EXPEDIENTE DE CALIBRACIÓN</span><h1>${esc(col.nombre)}</h1><p>${esc(col.puesto||'')} · ${esc(col.area)} · ${esc(col.ciudad||'')}</p><div class="calibration-meta"><span>Líder: <b>${esc(liderDirecto ? liderDirecto.nombre : '—')}</b></span><span>Antigüedad: <b>${esc(col.antiguedad||'—')}</b></span></div></div>
        <div class="calibration-final-score"><span>Resultado actual</span><strong>${f1(resultadoActual)}</strong>${badge(C.clasificarNivel(resultadoActual).nivel,'blue')}</div>
      </div>

      <div class="calibration-score-grid">
        <div class="calibration-score-card"><span>Autoevaluación</span><strong>${f1(resAuto.puntajes.total)}</strong><small>Percepción del colaborador</small></div>
        <div class="calibration-score-card"><span>Evaluación líder</span><strong>${f1(resLider.puntajes.total)}</strong><small>Resultado base de calibración</small></div>
        <div class="calibration-score-card ${Math.abs(diferencia)>=10?'attention':''}"><span>Brecha auto vs líder</span><strong>${diferencia>0?'+':''}${f1(diferencia)}</strong><small>${esc(brechaGeneral.etiqueta)}</small></div>
        <div class="calibration-score-card success"><span>Resultado calibrado</span><strong>${f1(resultadoActual)}</strong><small>${cal.resultadoCalibrado!==undefined?'Guardado por RH':'Sin ajuste aún'}</small></div>
      </div>

      <div class="calibration-analysis-grid">
        <article class="admin-panel calibration-chart-card"><div class="admin-panel-head"><div><span class="admin-section-kicker">COMPARATIVO</span><h2>Radar de evaluación</h2></div></div>${radarHtml}</article>
        <article class="admin-panel calibration-chart-card"><div class="admin-panel-head"><div><span class="admin-section-kicker">TALENTO</span><h2>Ubicación 9-Box</h2></div></div>${ninaBoxHtml}</article>
      </div>

      <div class="calibration-workspace-grid">
        <article class="admin-panel calibration-context-card">
          <div class="admin-panel-head"><div><span class="admin-section-kicker">CONTEXTO</span><h2>Alertas para RH</h2></div></div>
          <div class="calibration-context-grid"><label><span>Actas administrativas</span><input type="number" min="0" id="calActas" value="${cal.actas || 0}"/></label><label><span>Indicador / referencia NOM-035</span><input type="text" id="calNom035" value="${esc(cal.nom035 || '')}" placeholder="Sin dato"/></label></div>
          <div class="calibration-info-note">Estos datos son contextuales. En esta demo no generan un descuento automático sobre la calificación.</div>
          <label class="calibration-field"><span>Observaciones de RH</span><textarea id="calObs" placeholder="Registra hechos, contexto o acuerdos relevantes...">${esc(cal.observacionesRH || '')}</textarea></label>
        </article>

        <article class="admin-panel calibration-decision-card">
          <div class="admin-panel-head"><div><span class="admin-section-kicker">DECISIÓN</span><h2>Ajuste de calibración</h2></div><span class="calibration-live-result" id="calLiveBadge">${f1(resultadoActual)}</span></div>
          <div class="calibration-adjust-row"><label><span>Ajuste en puntos</span><input type="number" step="0.1" id="calAjuste" value="${cal.ajuste || 0}" oninput="App.previewCalibracion(${resLider.puntajes.total})"/></label><label><span>Resultado calibrado</span><input type="text" id="calResultadoPreview" value="${f1(resultadoActual)}" disabled/></label></div>
          <label class="calibration-field"><span>Justificación <em>obligatoria cuando exista ajuste</em></span><textarea id="calJustificacion" placeholder="Explica la razón del ajuste y la evidencia utilizada...">${esc(cal.justificacion || '')}</textarea></label>
          <div class="calibration-actions"><button class="btn btn-primary" onclick="App.guardarCalibracion('${colaboradorId}','${periodoId}',${resLider.puntajes.total})">Guardar calibración</button><button class="btn btn-outline" ${cal.resultadoCalibrado === undefined ? 'disabled' : ''} onclick="App.habilitarRetro('${colaboradorId}','${periodoId}')">${cal.retroHabilitada ? '✓ Retroalimentación habilitada' : 'Habilitar retroalimentación'}</button></div>
          ${planes.length < 1 ? '<div class="calibration-warning-note">Si el resultado calibrado es menor a 80, se requerirá al menos un plan de desarrollo antes de liberar la retroalimentación.</div>' : ''}
        </article>
      </div>

      <article class="admin-panel calibration-history-card"><div class="admin-panel-head"><div><span class="admin-section-kicker">AUDITORÍA</span><h2>Trazabilidad de cambios</h2></div><span class="admin-panel-note">${(cal.historial||[]).length} movimientos</span></div><div class="admin-table-wrap"><table class="table table-compact admin-table"><thead><tr><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Motivo</th><th>Usuario</th><th>Fecha</th><th>Hora</th></tr></thead><tbody>${(cal.historial || []).slice().reverse().map((h) => `<tr><td>${esc(h.campo)}</td><td>${esc(JSON.stringify(h.valorAnterior))}</td><td>${esc(JSON.stringify(h.valorNuevo))}</td><td>${esc(h.motivo)}</td><td>${esc(h.usuario)}</td><td>${esc(h.fecha)}</td><td>${esc(h.hora)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">Sin cambios registrados.</td></tr>'}</tbody></table></div></article>
    </section>`;
  }

  function view9BoxAdmin(periodoId) {
    const datos = datosGlobales(periodoId).filter((d) => d.cuad.cuadrante);
    const ocupantes = datos.map((d) => ({
      empleado: d.c.empleado, nombre: d.c.nombre, cuadrante: d.cuad.cuadrante,
      destacado: state.nineboxSelEmpleado === d.c.empleado
    }));
    const gridHtml = global.EDDCharts.renderNineBoxFull({
      ocupantes,
      resaltarCuadrante: state.nineboxSel,
      onCellClickJs: (numero) => `App.selNinebox(${numero})`,
      onMarkerClickJs: (empleado) => `App.selNineboxColaborador('${empleado}')`
    });

    const sel = state.nineboxSel ? C.CUADRANTES_INFO[state.nineboxSel] : null;
    const ocupSel = sel ? datos.filter((d) => d.cuad.cuadrante === state.nineboxSel) : [];
    const seleccionado = state.nineboxSelEmpleado ? datos.find((d) => d.c.empleado === state.nineboxSelEmpleado) : null;

    let panelDetalle = '<p class="muted">Haz clic en un cuadrante para ver su significado y acción sugerida, o en el marcador de un colaborador para ver su detalle individual.</p>';
    if (seleccionado) {
      panelDetalle = `<div class="cuadrante-detail">
        <h4>${esc(seleccionado.c.nombre)} <span class="muted">— ${esc(seleccionado.c.area)}</span></h4>
        <div class="kpi-grid kpi-grid-3">
          ${kpi('Puntaje de desempeño', f1(seleccionado.promedios ? seleccionado.promedios.desempeno : null))}
          ${kpi('Potencial preliminar', f1(seleccionado.promedios ? seleccionado.promedios.actitud : null))}
          ${kpi('Resultado final', f1(seleccionado.totalFinal))}
        </div>
        ${renderCuadranteInfo(seleccionado.cuad)}
        <button class="btn btn-outline btn-sm" onclick="App.limpiarSeleccionNinebox()">Quitar selección individual</button>
      </div>`;
    } else if (sel) {
      panelDetalle = `<div class="cuadrante-detail">${renderCuadranteInfo({ cuadrante: state.nineboxSel, info: sel })}<h4>Colaboradores en este cuadrante</h4><ul>${ocupSel.map((o) => `<li><a href="#" onclick="event.preventDefault();App.selNineboxColaborador('${o.c.empleado}')">${esc(o.c.nombre)}</a> — ${esc(o.c.area)} (${f1(o.totalFinal)} pts)</li>`).join('') || '<li class="muted">Sin colaboradores.</li>'}</ul></div>`;
    }

    return `
    <div class="card">
      <h2>Matriz 9-Box</h2>
      <p class="muted">Criterio oficial Rev4 para ambos ejes: Bajo &lt;60, Medio / esperado 60–79, Alto 80–100 (base 100).</p>
      ${gridHtml}
      ${panelDetalle}
    </div>`;
  }

  function viewAuditoria() {
    const db = S.load();
    return `<div class="card"><h2>Auditoría</h2>
    <table class="table"><thead><tr><th>Usuario</th><th>Acción</th><th>Entidad</th><th>ID</th><th>Fecha</th><th>Hora</th><th>Valor anterior</th><th>Valor nuevo</th></tr></thead><tbody>
    ${db.auditoria.slice(0, 200).map((a) => `<tr><td>${esc(a.usuario)}</td><td>${esc(a.accion)}</td><td>${esc(a.entidad)}</td><td>${esc(a.entidadId)}</td><td>${esc(a.fecha)}</td><td>${esc(a.hora)}</td><td>${esc(a.valorAnterior)}</td><td>${esc(a.valorNuevo)}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function viewConfig() {
    const cfg = S.getConfiguracion();
    return `<div class="card">
      <h2>Configuración</h2>
      <h3>Umbrales de brecha (comparación auto vs. líder)</h3>
      <div class="form-row">
        <div class="form-group"><label>Alineada hasta</label><input type="number" step="0.01" id="cfgAlineada" value="${cfg.configBrecha.alineadaMax}"/></div>
        <div class="form-group"><label>Revisar hasta</label><input type="number" step="0.01" id="cfgRevisar" value="${cfg.configBrecha.revisarMax}"/></div>
      </div>
      <button class="btn btn-outline" onclick="App.guardarConfigBrecha()">Guardar umbrales</button>
      <h3 style="margin-top:24px">Reinicio de datos</h3>
      <p class="muted">Restaura todos los datos de la demo a su estado inicial (usuarios, evaluaciones, calibraciones, auditoría). Esta acción no se puede deshacer.</p>
      <button class="btn btn-danger" onclick="App.reiniciarDemo()">Reiniciar datos de la demo</button>
    </div>`;
  }

  // Traduce errores de auth.js/api.js a mensajes seguros para el usuario
  // final (nunca trazas técnicas — eso solo va a consola, ver
  // requerimiento 12 del brief).
  function mensajeErrorLogin(err) {
    const tipo = err && err.tipo;
    if (tipo === 'network') return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    if (tipo === 'timeout') return 'La solicitud tardó demasiado. Intenta de nuevo.';
    if (tipo === 'expired') return 'El código venció. Solicita uno nuevo.';
    if (tipo === 'invalid_code') return 'Código inválido. Verifica los 6 dígitos e intenta de nuevo.';
    if (tipo === 'validation') return err.message || 'Verifica los datos capturados.';
    if (tipo === 'unauthorized') return 'Tu sesión expiró. Inicia sesión nuevamente.';
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }

  // =========================================================================
  // ACCIONES (expuestas a los onclick del HTML)
  // =========================================================================

  function limpiarErroresVisuales(root) {
    (root || document).querySelectorAll('.validation-error').forEach((el) => el.classList.remove('validation-error'));
  }

  function marcarErroresYEnfocar(elementos) {
    const faltantes = (elementos || []).filter(Boolean);
    faltantes.forEach((el) => el.classList.add('validation-error'));
    if (faltantes.length) {
      const primero = faltantes[0];
      primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = primero.querySelector('input:not([disabled]), textarea:not([disabled]), button:not([disabled])');
      if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 300);
    }
    return faltantes.length;
  }

  function validarSeccionVisual(evaluacionId, seccion) {
    const wizard = document.querySelector('.wizard-card') || document;
    limpiarErroresVisuales(wizard);
    const faltantes = [];

    if (seccion !== 'objetivos') {
      const respuestas = S.getRespuestasPorSeccion(evaluacionId)[seccion] || [];
      const respondidas = new Set(respuestas.filter((r) => r.valor !== '' && r.valor !== null && r.valor !== undefined).map((r) => String(r.competenciaId)));
      (D.COMPETENCIAS[seccion] || []).forEach((c) => {
        if (!respondidas.has(String(c.id))) {
          faltantes.push(Array.from(wizard.querySelectorAll('.competency-card')).find((el) => el.dataset.competenciaId === String(c.id)));
        }
      });
    } else if (state.wizard.tipo === 'lider') {
      const objetivos = S.getObjetivos(evaluacionId) || [];
      const filas = wizard.querySelectorAll('.objetivo-row');
      filas.forEach((fila) => {
        const idx = Number(fila.dataset.idx);
        const o = objetivos.find((x) => Number(x.index) === idx);
        if (!o || o.calificacion === '' || o.calificacion === null || o.calificacion === undefined) faltantes.push(fila);
      });
    } else {
      const objetivos = S.getObjetivos(evaluacionId) || [];
      const filas = wizard.querySelectorAll('.objetivo-row');
      filas.forEach((fila, i) => {
        const o = objetivos.find((x) => Number(x.index) === i);
        const tieneAlgo = o && ((o.descripcion || '').trim() || (o.meta || '').trim() || (o.resultado || '').trim() || o.calificacion || o.cumplimiento !== '' || o.noCuantificable);
        const completo = o && (o.descripcion || '').trim() && (o.meta || '').trim() && (o.resultado || '').trim() && o.calificacion;
        if (tieneAlgo && !completo) faltantes.push(fila);
      });
      if (!objetivos.some((o) => (o.descripcion || '').trim() && (o.meta || '').trim() && (o.resultado || '').trim() && o.calificacion)) {
        if (!faltantes.length && filas[0]) faltantes.push(filas[0]);
      }
    }

    return marcarErroresYEnfocar(faltantes);
  }

  function requiereJustificacionNA(evaluacionId) {
    const por = S.getRespuestasPorSeccion(evaluacionId);
    return ['actitud','habilidades'].some((sec) => {
      const total = (D.COMPETENCIAS[sec] || []).length;
      if (!total) return false;
      const na = (por[sec] || []).filter((r) => String(r.valor) === 'N/A').length;
      return na > total / 2;
    });
  }

  const Actions = {
    setLanguage(lang) { setLanguage(lang); },
    logout,
    async solicitarCodigo(numeroEmpleado) {
      state.login.error = null; state.login.info = null;
      if (!numeroEmpleado) { state.login.error = 'Captura tu número de empleado.'; render(); return; }
      state.login.loading = true; state.login.numeroEmpleado = numeroEmpleado; render();
      try {
        const resp = await A.requestCode(numeroEmpleado);
        state.login.paso = 'validar';
        state.login.maskedEmail = resp.maskedEmail || null;
        state.login.loading = false;
        state.login.info = null;
        render();
      } catch (err) {
        console.error('Error al solicitar código', err);
        state.login.loading = false;
        state.login.error = mensajeErrorLogin(err);
        render();
      }
    },
    async validarCodigo() {
      const codigo = ($('#loginCodigo') || {}).value || '';
      state.login.error = null; state.login.info = null; state.login.loading = true; render();
      try {
        const resp = await A.verifyCode(state.login.numeroEmpleado, codigo.trim());
        const appUser = A.getAppUser();
        state.user = appUser;
        S.addAudit(appUser.nombre, 'Inicio de sesión', 'usuarios', appUser.empleado, null, appUser.perfil);
        resetLoginState('solicitar');
        irAHomeDePerfil(appUser.perfil);
      } catch (err) {
        console.error('Error al validar código', err);
        state.login.loading = false;
        state.login.error = mensajeErrorLogin(err);
        render();
      }
    },
    async reenviarCodigo() {
      await Actions.solicitarCodigo(state.login.numeroEmpleado);
      state.login.info = 'Se envió un nuevo código.';
      render();
    },
    corregirEmpleado() {
      A.limpiarPendiente();
      resetLoginState('solicitar');
      render();
    },
    async quickLogin(numeroEmpleado) {
      if (global.APP_CONFIG.mode === 'api') return; // solo disponible en modo demo
      state.login.error = null; state.login.info = null; state.login.loading = true; render();
      try {
        await A.requestCode(numeroEmpleado);
        const resp = await A.verifyCode(numeroEmpleado, global.APP_CONFIG.demoCode);
        const appUser = A.getAppUser();
        state.user = appUser;
        S.addAudit(appUser.nombre, 'Inicio de sesión', 'usuarios', appUser.empleado, null, appUser.perfil);
        resetLoginState('solicitar');
        irAHomeDePerfil(appUser.perfil);
      } catch (err) {
        console.error('Error en acceso rápido', err);
        state.login.loading = false;
        state.login.error = mensajeErrorLogin(err);
        render();
      }
    },
    comenzarEvaluacion() {
      marcarIntroVista();
      navigate('#/colaborador/autoevaluacion');
    },
    wizardNext(seccionActual) {
      if (seccionActual !== 'resumen') {
        const ev = { id: state.wizard.evaluacionId };
        const seccion = seccionActual;
        const faltantes = validarSeccionVisual(ev.id, seccion);
        if (faltantes) {
          alert(currentLang === 'en' ? `You cannot continue. You have ${faltantes} pending field${faltantes === 1 ? '' : 's'}. Review the fields marked in red.` : `No puedes continuar. Tienes ${faltantes} campo${faltantes === 1 ? '' : 's'} pendiente${faltantes === 1 ? '' : 's'}. Revisa lo marcado en rojo.`);
          return;
        }
      }
      state.wizard.seccionIdx = Math.min(state.wizard.seccionIdx + 1, SECCIONES_WIZARD.length - 1);
      render();
    },
    wizardPrev() { state.wizard.seccionIdx = Math.max(state.wizard.seccionIdx - 1, 0); render(); },
    irSeccionWizard(idx) { state.wizard.seccionIdx = Math.max(0, Math.min(Number(idx) || 0, SECCIONES_WIZARD.length - 1)); render(); },
    comprenderObjetivos(evaluacionId) { sessionStorage.setItem(objectivesAckKey(evaluacionId), '1'); render(); },
    guardarProgresoVisual() { const btn = document.querySelector('.premium-save-btn'); if (!btn) return; const original = btn.textContent; btn.textContent = '✓ Guardado'; btn.classList.add('saved'); setTimeout(() => { btn.textContent = original; btn.classList.remove('saved'); }, 1400); },
    rate(evaluacionId, seccion, competenciaId, valor) {
      const existentes = S.getRespuestas(evaluacionId);
      const actual = existentes.find((r) => r.competenciaId === competenciaId);
      S.saveRespuesta(evaluacionId, seccion, competenciaId, valor, actual ? actual.comentario : '');
      const card = Array.from(document.querySelectorAll('.competency-card')).find((el) => el.dataset.competenciaId === String(competenciaId));
      if (card) card.classList.remove('validation-error');
    },
    comentar(evaluacionId, seccion, competenciaId, comentario) {
      const existentes = S.getRespuestas(evaluacionId);
      const actual = existentes.find((r) => r.competenciaId === competenciaId);
      S.saveRespuesta(evaluacionId, seccion, competenciaId, actual ? actual.valor : '', comentario);
    },
    agregarObjetivo(evaluacionId) {
      const objetivos = S.getObjetivos(evaluacionId);
      if (objetivos.length >= 5) return;
      const usados = new Set(objetivos.map((o) => Number(o.index)));
      let nextIndex = 0; while (usados.has(nextIndex)) nextIndex++;
      S.saveObjetivo(evaluacionId, nextIndex, '', '', '', { meta:'', cumplimiento:'', noCuantificable:false });
      render();
    },
    editarObjetivo(evaluacionId, index, campo, valor) {
      return Actions.editarObjetivoKPI(evaluacionId, index, campo, valor);
    },
    editarObjetivoKPI(evaluacionId, index, campo, valor) {
      const objetivos = S.getObjetivos(evaluacionId);
      const o = objetivos.find((x) => Number(x.index) === Number(index)) || { index:Number(index), descripcion:'', meta:'', resultado:'', cumplimiento:'', noCuantificable:false, calificacion:'' };
      o[campo] = valor;
      if (campo === 'cumplimiento' && valor !== '') {
        const score = C.calificacionPorCumplimiento(valor);
        if (score !== null) o.calificacion = score;
      }
      if (campo === 'noCuantificable' && valor) o.cumplimiento = '';
      S.saveObjetivo(evaluacionId, Number(index), o.descripcion || '', o.resultado || '', o.calificacion || '', {
        meta: o.meta || '', cumplimiento: o.cumplimiento ?? '', noCuantificable: !!o.noCuantificable
      });
      const fila = document.querySelector(`.objetivo-row[data-idx="${Number(index)}"]`);
      if (fila && (o.descripcion || '').trim() && (o.meta || '').trim() && (o.resultado || '').trim() && o.calificacion) fila.classList.remove('validation-error');
      if (campo === 'cumplimiento' || campo === 'noCuantificable') render();
    },
    editarObjetivoSmart(evaluacionId, index, campo, valor) {
      // Compatibilidad temporal: SMART queda fuera del flujo Rev.4; redirige a captura KPI.
      return Actions.editarObjetivoKPI(evaluacionId, index, campo, valor);
    },
    quitarObjetivo(evaluacionId, index) { S.removeObjetivo(evaluacionId, index); render(); },

    // --- Asistente de IA para objetivos SMART -----------------------------
    abrirAsistenteIA(evaluacionId, index) {
      state.aiSmart.open = true;
      state.aiSmart.evaluacionId = evaluacionId;
      state.aiSmart.index = Number(index);
      state.aiSmart.idea = '';
      state.aiSmart.loading = false;
      state.aiSmart.error = null;
      state.aiSmart.proposal = null;
      renderAiSmartModal();
    },
    cerrarAsistenteIA() {
      if (state.aiSmart.loading) return; // evita cerrar a medio de una solicitud en curso
      if (state.aiSmart.proposal) {
        console.log('[AUDIT] AI_SMART_DISCARDED', { employeeId: state.user.empleado, evaluationId: state.aiSmart.evaluacionId, objectiveIndex: state.aiSmart.index, timestamp: new Date().toISOString() });
      }
      state.aiSmart.open = false;
      renderAiSmartModal();
    },
    actualizarIdeaIA(valor) {
      state.aiSmart.idea = String(valor || '').slice(0, AI_IDEA_MAX);
      state.aiSmart.error = null;
      renderAiSmartModal();
    },
    async generarPropuestaIA() {
      const ai = state.aiSmart;
      const idea = (ai.idea || '').trim();
      if (idea.length < AI_IDEA_MIN) { ai.error = t('Escribe al menos 5 caracteres para describir tu idea.'); renderAiSmartModal(); return; }
      ai.loading = true; ai.error = null;
      renderAiSmartModal();
      // AI_SMART_REQUEST — auditoría del lado del backend en producción (ver
      // README); en demo se registra en consola para poder verificar el flujo.
      console.log('[AUDIT] AI_SMART_REQUEST', { employeeId: state.user.empleado, evaluationId: ai.evaluacionId, objectiveIndex: ai.index, timestamp: new Date().toISOString() });
      try {
        const col = S.getColaborador(state.wizard.colaboradorId);
        const employeeContext = col ? { position: col.puesto, area: col.area } : undefined;
        const propuesta = await generarPropuestaSmartIA(idea, currentLang, employeeContext);
        state.aiSmart.proposal = propuesta;
        state.aiSmart.loading = false;
        renderAiSmartModal();
      } catch (err) {
        console.error('Asistente de IA SMART: error al generar propuesta', err);
        state.aiSmart.loading = false;
        state.aiSmart.error = t('No fue posible generar la propuesta en este momento. Puedes continuar redactando el objetivo manualmente.');
        renderAiSmartModal();
      }
    },
    regenerarPropuestaIA() {
      state.aiSmart.proposal = null;
      renderAiSmartModal();
      Actions.generarPropuestaIA();
    },
    // Botón "Editar": lleva el foco al campo de objetivo dentro de la propia
    // vista previa — los campos de la propuesta ya son editables directamente
    // (ver renderAiSmartPreview), así que aquí solo reforzamos visualmente
    // cuál es el campo a ajustar (comportamiento discreto, sin bloquear nada).
    editarPropuestaIA() {
      const el = document.getElementById('aiSmartObjectiveInput');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    },
    usarPropuestaIA() {
      const ai = state.aiSmart;
      const objectiveEl = document.getElementById('aiSmartObjectiveInput');
      const indicatorEl = document.getElementById('aiSmartIndicatorInput');
      const objetivo = objectiveEl ? objectiveEl.value.trim() : (ai.proposal ? ai.proposal.objective : '');
      const meta = indicatorEl ? indicatorEl.value.trim() : (ai.proposal ? ai.proposal.indicator : '');
      Actions.editarObjetivoSmart(ai.evaluacionId, ai.index, 'descripcion', objetivo);
      Actions.editarObjetivoSmart(ai.evaluacionId, ai.index, 'meta', meta);
      // Solo se prellena la fecha de compromiso si la IA devolvió una fecha
      // EXACTA (formato AAAA-MM-DD); si devolvió un plazo relativo ("3 meses")
      // nunca se inventa una fecha absoluta — se muestra como sugerencia junto
      // al campo y el usuario elige la fecha manualmente (ver requerimiento 9).
      const plazo = ai.proposal ? ai.proposal.suggestedDeadline : null;
      if (plazo && /^\d{4}-\d{2}-\d{2}$/.test(plazo)) {
        Actions.editarObjetivoSmart(ai.evaluacionId, ai.index, 'fechaCompromiso', plazo);
      } else if (plazo) {
        state.aiSmart.deadlineHints[claveHintPlazo(ai.evaluacionId, ai.index)] = plazo;
      }
      console.log('[AUDIT] AI_SMART_ACCEPTED', { employeeId: state.user.empleado, evaluationId: ai.evaluacionId, objectiveIndex: ai.index, timestamp: new Date().toISOString() });
      state.aiSmart.open = false;
      renderAiSmartModal();
      render();
    },
    enviarAutoevaluacion() {
      if (!$('#confirmEnvioAuto').checked) { alert(t('Confirma que la información es correcta antes de enviar.')); return; }
      const evaluacionId = state.wizard.evaluacionId;
      for (let i = 0; i < SECCIONES_WIZARD.length - 1; i++) {
        const sec = SECCIONES_WIZARD[i];
        const incompleta = sec === 'objetivos'
          ? !S.getObjetivos(evaluacionId).some((o) => (o.descripcion || '').trim() && (o.meta || '').trim() && (o.resultado || '').trim() && o.calificacion)
          : (S.getRespuestasPorSeccion(evaluacionId)[sec] || []).filter((r) => r.valor !== '' && r.valor !== null && r.valor !== undefined).length < D.COMPETENCIAS[sec].length;
        if (incompleta) {
          state.wizard.seccionIdx = i; render();
          setTimeout(() => {
            const n = validarSeccionVisual(evaluacionId, sec);
            alert(currentLang === 'en' ? `You cannot submit. You have ${n || 'some'} pending fields; review those marked in red.` : `No puedes enviar. Tienes ${n || 'campos'} pendientes; revisa lo marcado en rojo.`);
          }, 0);
          return;
        }
      }
      const objetivos = S.getObjetivos(evaluacionId).filter((o) => o.descripcion && o.descripcion.trim());
      if (!objetivos.length) { alert(t('Registra al menos un objetivo antes de enviar.')); return; }
      const evActual = S.load().evaluaciones.find((e) => e.id === evaluacionId);
      if (requiereJustificacionNA(evaluacionId) && !(evActual && String(evActual.comentarios || '').trim())) {
        state.wizard.seccionIdx = SECCIONES_WIZARD.length - 1; render();
        setTimeout(() => alert('Más de la mitad de una sección está marcada como N/A. Agrega una justificación en Comentarios u observaciones antes de enviar.'), 0);
        return;
      }
      S.completarEvaluacion(evaluacionId, state.user.nombre);
      navigate('#/colaborador/enviado');
    },
    editarObjetivoLider(evaluacionId, index, calificacion) {
      const autoEval = S.getEvaluacion(state.wizard.colaboradorId, state.periodo.id, 'autoevaluacion');
      const fuente = autoEval ? S.getObjetivos(autoEval.id).find((o) => Number(o.index) === Number(index)) : null;
      if (!fuente) {
        console.error('No se encontró el objetivo origen para la evaluación del líder', { evaluacionId, index });
        return;
      }
      // La descripción y el resultado siempre se toman del registro fuente del colaborador,
      // evitando pasarlos interpolados dentro de HTML/JS y manteniendo la relación por índice.
      S.saveObjetivo(evaluacionId, Number(index), fuente.descripcion || '', fuente.resultado || '', calificacion, { meta: fuente.meta || '', cumplimiento: fuente.cumplimiento ?? '', noCuantificable: !!fuente.noCuantificable });
      const fila = document.querySelector(`.objetivo-row[data-idx="${Number(index)}"]`);
      if (fila && calificacion) fila.classList.remove('validation-error');
    },
    setFortalezas(evaluacionId, valor) {
      const db = S.load(); const ev = db.evaluaciones.find((e) => e.id === evaluacionId); if (ev) { ev.fortalezas = valor; S.persist(); }
    },
    setComentarios(evaluacionId, valor) {
      const db = S.load(); const ev = db.evaluaciones.find((e) => e.id === evaluacionId); if (ev) { ev.comentarios = valor; S.persist(); }
    },
    agregarAreaOportunidad(colaboradorId) {
      const area = prompt('Área de oportunidad:'); if (!area) return;
      const plan = prompt('Plan de mejora:'); if (!plan) return;
      S.addAreaOportunidad(colaboradorId, state.periodo.id, area, plan, state.user.nombre);
      render();
    },
    quitarAreaOportunidad(id) { S.removeAreaOportunidad(id, state.user.nombre); render(); },
    agregarPlanDesarrollo(colaboradorId, liderId) {
      const competencia = prompt('Competencia a desarrollar:'); if (!competencia) return;
      const accion = prompt('Acción:'); if (!accion) return;
      const fecha = prompt('Fecha compromiso (AAAA-MM-DD):', '2026-09-01') || '2026-09-01';
      S.addPlanDesarrollo(colaboradorId, state.periodo.id, { competencia, accion, responsable: liderId, fechaCompromiso: fecha }, state.user.nombre);
      render();
    },
    quitarPlanDesarrollo(id) { S.removePlanDesarrollo(id, state.user.nombre); render(); },
    enviarEvaluacionLider(colaboradorId) {
      if (!$('#confirmEnvioLider').checked) { alert(t('Confirma que la evaluación está completa antes de enviar.')); return; }
      const evaluacionId = state.wizard.evaluacionId;
      for (let i = 0; i < SECCIONES_WIZARD.length - 1; i++) {
        const sec = SECCIONES_WIZARD[i];
        let incompleta;
        if (sec === 'objetivos') {
          const autoEval = S.getEvaluacion(colaboradorId, state.periodo.id, 'autoevaluacion');
          const objetivosAuto = autoEval ? S.getObjetivos(autoEval.id).filter((o) => (o.descripcion || '').trim()) : [];
          const objetivosLider = S.getObjetivos(evaluacionId);
          incompleta = objetivosAuto.some((oa) => {
            const ol = objetivosLider.find((x) => Number(x.index) === Number(oa.index));
            return !ol || ol.calificacion === '' || ol.calificacion === null || ol.calificacion === undefined;
          });
        } else {
          incompleta = (S.getRespuestasPorSeccion(evaluacionId)[sec] || []).filter((r) => r.valor !== '' && r.valor !== null && r.valor !== undefined).length < D.COMPETENCIAS[sec].length;
        }
        if (incompleta) {
          state.wizard.seccionIdx = i; render();
          setTimeout(() => {
            const n = validarSeccionVisual(evaluacionId, sec);
            alert(currentLang === 'en' ? `You cannot submit. You have ${n || 'some'} pending fields; review those marked in red.` : `No puedes enviar. Tienes ${n || 'campos'} pendientes; revisa lo marcado en rojo.`);
          }, 0);
          return;
        }
      }
      const evActual = S.load().evaluaciones.find((e) => e.id === evaluacionId);
      if (requiereJustificacionNA(evaluacionId) && !(evActual && String(evActual.comentarios || '').trim())) {
        state.wizard.seccionIdx = SECCIONES_WIZARD.length - 1; render();
        setTimeout(() => alert('Más de la mitad de una sección está marcada como N/A. Justifica el uso de N/A en Comentarios generales antes de enviar.'), 0);
        return;
      }
      S.completarEvaluacion(evaluacionId, state.user.nombre);
      navigate('#/lider/comparacion/' + colaboradorId);
    },
    cargarEvidencia(colaboradorId, periodoId) {
      const nombre = prompt('Nombre del archivo a cargar (simulado), ej. retroalimentacion_firmada.pdf:');
      if (!nombre) return;
      const tipo = prompt('Tipo (PDF firmado / Imagen / Documento de retroalimentación):', 'PDF firmado') || 'Documento';
      S.addEvidencia(colaboradorId, periodoId, nombre, tipo, state.user.nombre, '');
      render();
    },
    aceptar(colaboradorId, periodoId) {
      const evidencias = S.getEvidencias(colaboradorId, periodoId);
      if (!evidencias.length) { alert(t('Carga al menos una evidencia antes de aceptar el resultado.')); return; }
      S.aceptarResultado(colaboradorId, periodoId, state.user.nombre);
      render();
    },
    setFiltroAdmin(campo, valor) { state.adminFiltros[campo] = valor || undefined; render(); },
    limpiarFiltrosAdmin() { state.adminFiltros = {}; render(); },
    previewCalibracion(totalLider) {
      const ajusteEl = document.getElementById('calAjuste');
      const previewEl = document.getElementById('calResultadoPreview');
      const badgeEl = document.getElementById('calLiveBadge');
      if (!ajusteEl || !previewEl) return;
      const ajuste = parseFloat(ajusteEl.value || '0') || 0;
      const valor = C.round1(Math.max(0, Math.min(100, totalLider + ajuste)));
      previewEl.value = f1(valor);
      if (badgeEl) badgeEl.textContent = f1(valor);
    },
    guardarCalibracion(colaboradorId, periodoId, totalLider) {
      const ajuste = parseFloat($('#calAjuste').value) || 0;
      const justificacion = $('#calJustificacion').value.trim();
      if (ajuste !== 0 && !justificacion) { alert(t('La justificación es obligatoria cuando existe un ajuste distinto de 0.')); return; }
      const resultadoCalibrado = C.round1(Math.max(0, Math.min(100, totalLider + ajuste)));
      const resAuto = S.getUltimoResultadoPorOrigen(colaboradorId, periodoId, 'autoevaluacion');
      S.crearOActualizarCalibracion(colaboradorId, periodoId, {
        resultadoAuto: resAuto.puntajes.total, resultadoLider: totalLider,
        diferenciaGeneral: C.round1(resAuto.puntajes.total - totalLider),
        ajuste, justificacion, resultadoCalibrado,
        actas: parseInt($('#calActas').value, 10) || 0,
        nom035: $('#calNom035').value,
        observacionesRH: $('#calObs').value,
        responsable: state.user.nombre,
        _motivo: justificacion || 'Calibración de RH'
      }, state.user.nombre);
      alert(t('Calibración guardada.'));
      render();
    },
    habilitarRetro(colaboradorId, periodoId) {
      const cal = S.getCalibracion(colaboradorId, periodoId);
      if (!cal || cal.resultadoCalibrado === undefined) { alert(t('Guarda la calibración antes de habilitar la retroalimentación.')); return; }
      if (cal.resultadoCalibrado < 80) {
        const planes = S.getPlanesDesarrollo(colaboradorId, periodoId);
        if (!planes.length) { alert(t('El resultado es menor a 80. Registra al menos un plan de desarrollo antes de habilitar la retroalimentación.')); return; }
      }
      S.habilitarRetroalimentacion(colaboradorId, periodoId, state.user.nombre);
      alert(t('Retroalimentación habilitada para el colaborador.'));
      render();
    },
    selNinebox(numero) { state.nineboxSel = numero; state.nineboxSelEmpleado = null; render(); },
    selNineboxColaborador(empleado) {
      const col = S.getColaborador(empleado);
      const periodoId = state.periodo.id;
      const resLider = S.getUltimoResultadoPorOrigen(empleado, periodoId, 'lider');
      const cuad = resLider ? C.asignarCuadrante(resLider.promedios.actitud, resLider.promedios.desempeno) : null;
      state.nineboxSelEmpleado = empleado;
      state.nineboxSel = cuad ? cuad.cuadrante : state.nineboxSel;
      render();
    },
    limpiarSeleccionNinebox() { state.nineboxSelEmpleado = null; render(); },
    guardarConfigBrecha() {
      const alineadaMax = parseFloat($('#cfgAlineada').value);
      const revisarMax = parseFloat($('#cfgRevisar').value);
      if (isNaN(alineadaMax) || isNaN(revisarMax) || alineadaMax >= revisarMax) { alert(t('Verifica que "Alineada" sea menor que "Revisar".')); return; }
      S.updateConfigBrecha({ alineadaMax, revisarMax }, state.user.nombre);
      alert(t('Umbrales actualizados.'));
      render();
    },
    reiniciarDemo() {
      if (!confirm(t('¿Reiniciar todos los datos de la demo? Esta acción no se puede deshacer.'))) return;
      S.reset();
      A.clearSession();
      state.user = null;
      resetLoginState('solicitar');
      location.hash = '#/login';
      render();
    },
    setFiltroUsuarios(campo, valor) { state.usuariosFiltros[campo] = valor || undefined; render(); },
    limpiarFiltrosUsuarios() { state.usuariosFiltros = {}; render(); },
    setFiltroJerarquias(campo, valor) { state.jerarquiasFiltros[campo] = valor || undefined; render(); },
    limpiarFiltrosJerarquias() { state.jerarquiasFiltros = {}; render(); }
  };

  global.App = Actions;
  global.addEventListener('hashchange', render);
  global.addEventListener('DOMContentLoaded', render);
  // Si el backend responde 401 (token inválido/vencido en modo API), api.js
  // dispara este evento; auth.js ya limpió la sesión, aquí solo refrescamos
  // la pantalla para mandar al usuario al login con el aviso correspondiente.
  global.addEventListener(global.EDDApi.EVENTO_SESION_EXPIRADA, () => { if (state.user) render(); });
  // Verificación periódica de expiración por tiempo (no depende de que el
  // usuario haga clic en algo): si la sesión ya venció, se refleja en la UI
  // sin esperar a la siguiente navegación.
  setInterval(() => { if (state.user && !A.getSession()) render(); }, 15000);
  // ESC cierra el asistente de IA SMART (accesibilidad, requerimiento 23 del brief).
  global.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && state.aiSmart.open) Actions.cerrarAsistenteIA(); });
})(window);
