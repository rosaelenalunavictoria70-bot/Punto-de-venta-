#!/bin/bash
# Script Automatizado de Despliegue - RutaVenta POS
set -e

echo "===================================================="
echo "  RUTAVENTA POS - AUTOMATIZACIÓN DE DESPLIEGUE PWA  "
echo "===================================================="

echo "1. Instalando dependencias..."
npm install

echo "2. Compilando aplicación web progresiva (PWA Online/Offline)..."
npm run build

echo "3. Desplegando en Firebase Hosting y Reglas de Firestore..."
npx firebase-tools deploy --project gen-lang-client-0265265513

echo "✅ ¡Despliegue completado con éxito!"
