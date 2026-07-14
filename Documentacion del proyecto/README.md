1. Introducción
La Red Educativa Inteligente (R.E.I.) es una plataforma tecnológica diseñada para facilitar el acceso a recursos educativos digitales mediante una red local, permitiendo a estudiantes y docentes consultar libros, guías, documentos y material académico sin depender de una conexión a Internet. El sistema integra un servidor de almacenamiento local, una interfaz web intuitiva y, en futuras etapas, un asistente basado en inteligencia artificial que facilitará la búsqueda y consulta de la información disponible. Su propósito es fortalecer los procesos de enseñanza y aprendizaje en instituciones educativas, especialmente en contextos con limitaciones de conectividad y ruralidad.
2. Problema identificado
En muchas instituciones educativas, especialmente en zonas rurales o con recursos limitados, el acceso a contenidos digitales depende de una conexión estable a Internet, la cual no siempre está disponible o resulta insuficiente para atender la demanda de estudiantes y docentes. Esta situación dificulta el acceso oportuno a material de consulta, limita el aprovechamiento de herramientas digitales y genera una brecha en el acceso al conocimiento.
Además, gran parte de los recursos educativos disponibles se encuentran dispersos en múltiples plataformas, lo que dificulta su organización, consulta y reutilización dentro de los procesos pedagógicos.
3. Justificación
R.E.I. surge como una alternativa para democratizar el acceso al conocimiento mediante una infraestructura tecnológica autónoma que funciona completamente dentro de una red local. Al eliminar la dependencia de Internet para acceder a recursos educativos, el sistema permite que estudiantes y docentes consulten información de forma rápida, segura y permanente.
La propuesta aprovecha tecnologías abiertas y hardware de bajo consumo energético, promoviendo soluciones sostenibles y escalables que pueden implementarse en instituciones educativas, bibliotecas, centros comunitarios y espacios de formación.
En etapas posteriores, la incorporación de inteligencia artificial permitirá mejorar la experiencia de búsqueda, facilitando el acceso a la información mediante consultas en lenguaje natural.

4. Objetivos
4.1 Objetivo general

Diseñar e implementar una plataforma educativa basada en una red local que permita almacenar, organizar y consultar recursos académicos mediante una interfaz web, incorporando progresivamente herramientas de inteligencia artificial para facilitar la búsqueda y el acceso al conocimiento.



4.2 Objetivos específicos
Diseñar una infraestructura de red local que funcione de manera independiente de Internet.
Implementar un servidor central para el almacenamiento y administración de recursos educativos digitales.
Desarrollar una interfaz web que facilite la consulta y navegación del contenido.
Organizar los recursos educativos en categorías que respondan a diferentes áreas del conocimiento.
Integrar un sistema de búsqueda eficiente que permita localizar información de manera rápida.
Implementar, en futuras versiones, un asistente basado en inteligencia artificial para realizar consultas en lenguaje natural sobre el contenido almacenado.
Diseñar una solución fácilmente replicable en instituciones educativas con diferentes capacidades tecnológicas.
5. Propuesta de valor
R.E.I. ofrece una plataforma educativa que centraliza recursos académicos en una red local, permitiendo el acceso inmediato a información de calidad sin depender de Internet. La solución combina almacenamiento local, una interfaz web intuitiva y la futura integración de inteligencia artificial para facilitar la búsqueda y consulta de contenidos, mejorando la experiencia de aprendizaje y fortaleciendo los procesos educativos en comunidades con conectividad limitada.
6. Mercado objetivo
R.E.I. está dirigido a instituciones educativas públicas y privadas, bibliotecas, centros de formación, organizaciones comunitarias y entidades gubernamentales interesadas en fortalecer el acceso al conocimiento mediante soluciones tecnológicas locales. El proyecto responde especialmente a contextos donde la conectividad a Internet es limitada, intermitente o representa un alto costo operativo.
7. Usuarios
Los principales usuarios de R.E.I. son estudiantes de educación básica, media y superior, docentes, bibliotecarios, mediadores educativos y administradores tecnológicos de las instituciones. Cada perfil podrá acceder a los recursos de acuerdo con sus necesidades, permitiendo consultar material académico, compartir contenidos y, en futuras versiones, interactuar con herramientas de inteligencia artificial para facilitar el aprendizaje.
8. Modelo de negocio
R.E.I. propone un modelo de negocio Business to Business (B2B) orientado a instituciones educativas y organizaciones que requieren soluciones tecnológicas para la gestión del conocimiento. La oferta contempla la implementación del sistema, personalización según las necesidades de cada institución, acompañamiento en la puesta en marcha, capacitación a docentes y soporte técnico.

El modelo incorpora una estrategia escalable en la que una misma plataforma puede adaptarse a diferentes tamaños de instituciones mediante configuraciones de hardware y almacenamiento acordes con cada contexto. En el futuro, se proyecta ofrecer servicios complementarios como sincronización de contenidos, analítica educativa, administración remota e integración de inteligencia artificial especializada para entornos educativos.
Lo que realmente distingue a R.E.I. es que transforma un servidor de archivos en una plataforma inteligente de acceso al conocimiento.

Frase a destacar en las presentaciones y Pitch:
R.E.I. convierte una red local en un ecosistema educativo inteligente, donde el conocimiento está siempre disponible, organizado y preparado para ser consultado mediante herramientas de búsqueda e inteligencia artificial, independientemente de la disponibilidad de Internet.
Software:
•	Debian 13: Sistema operativo que administra los recursos del hardware y permite la ejecución de todos los servicios del servidor REI.
•	SSH: Permite el acceso remoto seguro para administrar y configurar el servidor sin necesidad de conectar un monitor o teclado directamente a la Raspberry Pi.
•	Nginx: Servidor web encargado de publicar la interfaz de R.E.I. (HTML, CSS y JavaScript) y atender las solicitudes HTTP realizadas por los usuarios. En futuras etapas podrá comunicarse con el motor de búsqueda y la API del sistema.
•	Samba: Servicio que permite compartir las carpetas del servidor mediante el protocolo SMB/CIFS, facilitando el acceso desde computadores Windows, Linux y otros dispositivos compatibles para administrar el contenido almacenado en el SSD.
Servicios establecidos: 
•	SSH
•	Nginx
•	Samba
Pendientes:
•	Avahi (acceso mediante nombre, por ejemplo http://rei.local) 
•	DNS (resolución de nombres dentro de la red local) 
•	DHCP (asignación automática de direcciones IP)

Hardware:
•	Raspberry Pi 5 SSD (Servidor principal)
•	Kingston 250 GB (almacenamiento)
•	Router (Red local y disctribucion de conectvidad)
Árbol de carpetas:
SSD
└── /mnt/rei-storage
    ├── Biblioteca
    │   ├── Ciencias
    │   ├── Docentes
    │   ├── Matemáticas
    │   ├── Programación
    │   └── Robótica
    ├── contenidos
    ├── documentos
    ├── multimedia
    ├── respaldos
    └── usuarios
Componente	Estado	Función
Debian 13	Implementado	Sistema operativo
SSH	Implementado	Administración remota
Nginx	Implementado	Servidor web
Samba	Implementado	Compartición de archivos
SSD	Implementado	Almacenamiento de contenidos
Portal Web REI	En desarrollo	Interfaz para los usuarios
Buscador local	Planeado	Localización de documentos
Motor de IA	Planeado	Búsqueda semántica y asistencia educativa
DNS Local	Planeado	Resolución de nombres
DHCP	Planeado	Administración de direcciones IP
Avahi	Planeado	Descubrimiento automático del servidor


	
