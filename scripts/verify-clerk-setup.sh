#!/bin/bash

# Script de validación de configuración de Clerk Auth

echo "🔍 Verificando configuración de Clerk Auth..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado"
    echo "   → Ejecutá: cp .env.example .env"
    echo "   → Luego configurá VITE_CLERK_PUBLISHABLE_KEY"
    exit 1
fi

# Source .env to check values
set -a
source .env
set +a

# Check for Clerk key
if [ -z "$VITE_CLERK_PUBLISHABLE_KEY" ]; then
    echo "❌ VITE_CLERK_PUBLISHABLE_KEY no configurada"
    echo "   → Obtené tu key desde: https://dashboard.clerk.com"
    echo "   → Debe empezar con pk_test_ (dev) o pk_live_ (prod)"
    exit 1
elif [[ ! "$VITE_CLERK_PUBLISHABLE_KEY" =~ ^pk_(test|live)_ ]]; then
    echo "❌ VITE_CLERK_PUBLISHABLE_KEY inválida"
    echo "   → Formato correcto: pk_test_... o pk_live_..."
    echo "   → Valor actual: $VITE_CLERK_PUBLISHABLE_KEY"
    exit 1
else
    # Determine environment
    if [[ "$VITE_CLERK_PUBLISHABLE_KEY" =~ ^pk_test_ ]]; then
        ENV_TYPE="development"
    else
        ENV_TYPE="production"
    fi
    echo "✅ VITE_CLERK_PUBLISHABLE_KEY configurada ($ENV_TYPE)"
fi

# Check for API URL
if [ -z "$VITE_API_URL" ]; then
    echo "⚠️  VITE_API_URL no configurada"
    echo "   → Se usará http://localhost:8088 por defecto"
    VITE_API_URL="http://localhost:8088"
else
    echo "✅ VITE_API_URL configurada: $VITE_API_URL"
fi

# Check for optional token contract settings
if [ -n "$VITE_CLERK_JWT_TEMPLATE" ]; then
    echo "✅ VITE_CLERK_JWT_TEMPLATE configurada: $VITE_CLERK_JWT_TEMPLATE"
else
    echo "ℹ️  VITE_CLERK_JWT_TEMPLATE no configurada (solo necesaria si el backend exige template)"
fi

if [ -n "$VITE_CLERK_AUDIENCE" ]; then
    echo "✅ VITE_CLERK_AUDIENCE configurada: $VITE_CLERK_AUDIENCE"
else
    echo "ℹ️  VITE_CLERK_AUDIENCE no configurada (solo necesaria si el backend exige audience)"
fi

if [ -z "$VITE_CLERK_JWT_TEMPLATE" ] && [ -z "$VITE_CLERK_AUDIENCE" ]; then
    echo "⚠️  Sin template/audience configurado. Si el backend tiene aud/iss estrictos, vas a recibir 401."
fi

# Check if @clerk/vue is installed
if [ -d "node_modules/@clerk/vue" ]; then
    CLERK_VERSION=$(node -p "require('./node_modules/@clerk/vue/package.json').version")
    echo "✅ @clerk/vue@$CLERK_VERSION instalado"
else
    echo "❌ @clerk/vue no instalado"
    echo "   → Ejecutá: npm install"
    exit 1
fi

# Check backend connectivity
echo ""
echo "🔌 Verificando conectividad con backend..."

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$VITE_API_URL/health" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Backend respondiendo en $VITE_API_URL"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo "⚠️  Backend no responde en $VITE_API_URL"
        echo "   → ¿Está corriendo el backend?"
        echo "   → Verificá que la URL sea correcta"
    else
        echo "⚠️  Backend respondió con código $HTTP_CODE"
    fi
else
    echo "⚠️  curl no disponible - no se puede verificar backend"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Configuración de Clerk válida!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Checklist antes de empezar:"
echo "   1. ✅ .env configurado"
echo "   2. ✅ Clerk SDK instalado"
echo "   3. ⏳ Backend corriendo (verificar arriba)"
echo "   4. ⏳ Clerk Dashboard configurado (ver CLERK_SETUP.md)"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. npm run dev"
echo "   2. Abrir http://localhost:5173"
echo "   3. Login con Google (u otro provider)"
echo "   4. Crear/seleccionar una organización"
echo ""
echo "📖 Documentación:"
echo "   • Setup:        docs/CLERK_SETUP.md"
echo "   • Arquitectura: docs/ARCHITECTURE.md"
echo "   • Testing:      docs/TESTING_GUIDE.md"
echo ""
