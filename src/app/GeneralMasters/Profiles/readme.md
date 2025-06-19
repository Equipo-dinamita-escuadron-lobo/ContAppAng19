# 📁 Estructura de Carpetas del Proyecto Angular

Este proyecto sigue una **arquitectura de slices verticales**, lo que significa que cada módulo o feature del negocio se agrupa por funcionalidades completas (y no por tipo de archivo como componentes, servicios, etc.). Esto mejora la escalabilidad, mantenibilidad y claridad del código.

## 📦 ¿Qué contiene cada slice?

Cada **carpeta de slice** (por ejemplo, `Commercial/BusinessMasters/Category`) contiene de forma encapsulada:

- `components/` – Componentes específicos del slice
- `services/` – Servicios que interactúan con APIs u otras capas
- `models/` – Interfaces o clases de tipado (opcional)
- `pipes/`, `guards/`, `utils/`, etc. – Cualquier recurso necesario dentro del contexto del slice


## 🧱 Reglas de creación y nomenclatura

### 🗂️ Carpetas

- Las carpetas deben nombrarse en **PascalCase** (primera letra de cada palabra en mayúscula).
  - ✅ `ProductTypes/`
  - ❌ `product-types/`, `producttypes/`

### 📄 Componentes y servicios

- Se deben generar con el CLI:  
  ```bash
    ng generate component <ruta>/<NombreComponente>
  ```
  ```bash
    ng generate service <ruta>/<nombre>
  ```

Cualquier duda sobre la estructura, puedes escribir a **Naren** lider técnico supremo alfa maravilla 


