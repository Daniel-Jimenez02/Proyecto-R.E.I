
# R.E.I. - Red Educativa Inteligente

> Una plataforma educativa local que democratiza el acceso al conocimiento mediante una red local, almacenamiento distribuido y futuras capacidades de inteligencia artificial.

---

# Tabla de contenido

- [Introducción](#introducción)
- [Problema identificado](#problema-identificado)
- [Justificación](#justificación)
- [Objetivos](#objetivos)
- [Propuesta de valor](#propuesta-de-valor)
- [Mercado objetivo](#mercado-objetivo)
- [Usuarios](#usuarios)
- [Modelo de negocio](#modelo-de-negocio)
- [Arquitectura del sistema](#arquitectura-del-sistema)
- [Software](#software)
- [Servicios](#servicios)
- [Hardware](#hardware)
- [Estructura de almacenamiento](#estructura-de-almacenamiento)
- [Estado del proyecto](#estado-del-proyecto)

---

# Introducción

La **Red Educativa Inteligente (R.E.I.)** es una plataforma tecnológica diseñada para facilitar el acceso a recursos educativos digitales mediante una red local, permitiendo a estudiantes y docentes consultar libros, guías, documentos y material académico sin depender de una conexión a Internet.

El sistema integra un servidor de almacenamiento local, una interfaz web intuitiva y, en futuras etapas, un asistente basado en inteligencia artificial que facilitará la búsqueda y consulta de la información disponible.

Su propósito es fortalecer los procesos de enseñanza y aprendizaje en instituciones educativas, especialmente en contextos con limitaciones de conectividad y ruralidad.

---

# Problema identificado

En muchas instituciones educativas, especialmente en zonas rurales o con recursos limitados, el acceso a contenidos digitales depende de una conexión estable a Internet.

Esta situación dificulta el acceso oportuno al material educativo, limita el uso de herramientas digitales y genera una brecha en el acceso al conocimiento.

Además, gran parte de los recursos educativos se encuentran dispersos en múltiples plataformas, dificultando su organización y reutilización.

---

# Justificación

R.E.I. surge como una alternativa para democratizar el acceso al conocimiento mediante una infraestructura tecnológica autónoma que funciona completamente dentro de una red local.

La solución elimina la dependencia de Internet para consultar recursos educativos, aprovechando tecnologías abiertas y hardware de bajo consumo energético.

En futuras versiones incorporará inteligencia artificial para mejorar la búsqueda de información mediante consultas en lenguaje natural.

---

# Objetivos

## Objetivo general

Diseñar e implementar una plataforma educativa basada en una red local que permita almacenar, organizar y consultar recursos académicos mediante una interfaz web, incorporando progresivamente herramientas de inteligencia artificial.

## Objetivos específicos

- Diseñar una infraestructura de red local independiente de Internet.
- Implementar un servidor central para almacenar recursos educativos.
- Desarrollar una interfaz web intuitiva.
- Organizar los contenidos por áreas del conocimiento.
- Implementar un sistema de búsqueda eficiente.
- Integrar un asistente basado en IA.
- Diseñar una solución fácilmente replicable.

---

# Propuesta de valor

R.E.I. centraliza recursos educativos en una red local, permitiendo acceder a ellos sin conexión a Internet.

La plataforma combina:

- Almacenamiento local.
- Interfaz web.
- Organización de contenidos.
- Futuro buscador inteligente mediante IA.

---

# Mercado objetivo

- Instituciones educativas públicas.
- Instituciones educativas privadas.
- Bibliotecas.
- Centros comunitarios.
- Centros de formación.
- Entidades gubernamentales.

---

# Usuarios

- Estudiantes.
- Docentes.
- Bibliotecarios.
- Mediadores educativos.
- Administradores tecnológicos.

---

# Modelo de negocio

Modelo **Business to Business (B2B)** orientado a instituciones educativas.

Incluye:

- Implementación del sistema.
- Personalización.
- Capacitación.
- Soporte técnico.
- Escalabilidad.

En futuras versiones se ofrecerán servicios como:

- Sincronización de contenidos.
- Administración remota.
- Analítica educativa.
- Inteligencia artificial especializada.

---

# Arquitectura del sistema

```
                  Usuarios
                      │
                      ▼
              Portal Web R.E.I.
                      │
      ┌───────────────┼───────────────┐
      │               │               │
 Biblioteca      Buscador IA      Administración
      │
      ▼
   SSD Local
```

---

# Software

| Software | Función |
|----------|----------|
| Debian 13 | Sistema operativo |
| SSH | Administración remota |
| Nginx | Servidor Web |
| Samba | Compartición de archivos |

---

# Servicios

## Implementados

- SSH
- Nginx
- Samba

## Pendientes

- Avahi
- DNS
- DHCP

---

# Hardware

| Componente | Función |
|------------|---------|
| Raspberry Pi 5 | Servidor principal |
| SSD Kingston 250 GB | Almacenamiento |
| Router | Red local |

---

# Estructura de almacenamiento

```text
/mnt/rei-storage
│
├── Biblioteca
│   ├── Ciencias
│   ├── Docentes
│   ├── Matemáticas
│   ├── Programación
│   └── Robótica
│
├── contenidos
├── documentos
├── multimedia
├── respaldos
└── usuarios
```

---

# Estado del proyecto

| Componente | Estado | Función |
|------------|---------|----------|
| Debian 13 | Implementado | Sistema operativo |
| SSH | Implementado | Administración remota |
| Nginx | Implementado | Servidor web |
| Samba | Implementado | Compartición de archivos |
| SSD | Implementado | Almacenamiento |
| Portal Web | En desarrollo | Interfaz de usuario |
| Buscador local | Planeado | Localización de documentos |
| Motor IA | Planeado | Búsqueda semántica |
| DNS Local | Planeado | Resolución de nombres |
| DHCP | Planeado | Gestión de direcciones IP |
| Avahi | Planeado | Descubrimiento del servidor |

---

# Visión del proyecto

> **R.E.I. convierte una red local en un ecosistema educativo inteligente, donde el conocimiento está siempre disponible, organizado y preparado para ser consultado mediante herramientas de búsqueda e inteligencia artificial, independientemente de la disponibilidad de Internet.**
