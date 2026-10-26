import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Cloud,
  Wifi,
  WifiOff,
  Smartphone,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Share2,
  CheckCircle2,
  Server,
  AlertTriangle,
  Rocket,
  GitBranch,
} from 'lucide-react';

export const DeploymentGuideView: React.FC = () => {
  const {
    firebaseUser,
    isSyncing,
    lastSyncedAt,
    pendingOfflineCount,
    signInWithGoogleCloud,
    signOutGoogleCloud,
    syncAllToCloud,
    customers,
    products,
    orders,
    salesUsers,
  } = useApp();

  const isOnline = useOnlineStatus();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const defaultPublicUrl = 'https://punto-de-venta-khaki.vercel.app';
  const [customAppUrl, setCustomAppUrl] = useState<string>(() => {
    const saved = localStorage.getItem('rv_custom_public_url');
    if (!saved || saved.includes('ais-pre-')) return defaultPublicUrl;
    return saved;
  });
  const [urlSaved, setUrlSaved] = useState(false);

  const publicAppUrl = customAppUrl.trim() || defaultPublicUrl;
  const firebaseConsoleUrl =
    'https://console.firebase.google.com/project/gen-lang-client-0265265513/overview';

  const handleSaveCustomUrl = (newUrl: string) => {
    setCustomAppUrl(newUrl);
    localStorage.setItem('rv_custom_public_url', newUrl.trim());
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2500);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.error('Copy error', e);
    }
  };

  const handleSync = async () => {
    if (!firebaseUser) {
      try {
        await signInWithGoogleCloud();
      } catch (e) {
        setSyncMessage('Conecta tu cuenta de Google para sincronizar con Firebase Cloud.');
        return;
      }
    }
    const res = await syncAllToCloud();
    setSyncMessage(res.message);
  };

  const whatsappShareText = encodeURIComponent(
    `*Acceso a RutaVenta POS - Fuerza de Ventas*\n\nIngresa desde tu celular o PC aquí:\n${publicAppUrl}\n\n1. Abre el enlace en Chrome o Safari.\n2. Toca "Instalar App" para tenerla en tu pantalla de inicio.\n3. Ingresa con tu código de vendedor (ej. VEN-002) y tu contraseña.`
  );
  const whatsappShareHref = `https://wa.me/?text=${whatsappShareText}`;

  const deployScriptCode = `#!/bin/bash
# Script Automatizado de Despliegue - RutaVenta POS
set -e
echo "1. Instalando dependencias..."
npm install

echo "2. Compilando aplicación PWA Offline/Online..."
npm run build

echo "3. Desplegando en Firebase Hosting y Reglas Firestore..."
npx firebase-tools deploy --project gen-lang-client-0265265513
echo "✅ ¡Aplicación publicada exitosamente fuera de Gemini!"`;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Operación Independiente</span>
            <span aria-hidden="true">·</span>
            <span>Proyecto Cloud: <strong className="font-mono text-slate-800">gen-lang-client-0265265513</strong></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Usar Fuera de Gemini, Modo Online/Offline y Automatización
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tu aplicación ya cuenta con tecnología PWA instalable, base de datos en la nube Firebase y soporte sin conexión para toda tu fuerza de ventas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <PWAInstallButton variant="full" />
          <a
            href={whatsappShareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir App a Vendedores</span>
          </a>
        </div>
      </div>

      {/* IMPORTANT ALERT: FIX "ESTA PÁGINA NO SE ENCUENTRA" & GITHUB "ROSA ELENA" */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-black text-amber-950">
              ¡Excelente! Ya guardaste tu proyecto «Rosa Elena» en GitHub. ¿Por qué aún no abre el link y qué hacer ahora?
            </h2>
            <p className="text-xs text-amber-900 leading-relaxed">
              El botón de <strong>GitHub</strong> que presionaste sirve para guardar el código fuente en tu cuenta de GitHub bajo el nombre <strong>«Rosa Elena»</strong>, pero <strong>no enciende la página web</strong> por sí solo. Tienes <strong>2 formas muy fáciles</strong> de activar tu link web ahora mismo:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-800 uppercase tracking-wider">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                <span>Opción A (Recomendada): Conectar tu GitHub «Rosa Elena» en Vercel</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <li>Haz clic en el botón morado de abajo para abrir <strong>Vercel.com</strong>.</li>
                <li>Elige <strong>«Continue with GitHub»</strong> (entra con la misma cuenta donde creaste <em>Rosa Elena</em>).</li>
                <li>Verás tu proyecto <strong>Rosa Elena</strong> en la lista: dale clic a <strong>Import</strong> y luego al botón <strong>Deploy</strong>.</li>
                <li>En 30 segundos te dará tu link definitivo (ej. <code>https://rosa-elena.vercel.app</code>) que abre en cualquier celular.</li>
              </ol>
            </div>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Vercel para Publicar mi GitHub «Rosa Elena»</span>
            </a>
          </div>

          <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-800 uppercase tracking-wider">
              <Rocket className="w-4 h-4 text-emerald-600" />
              <span>Opción B: El botón al costado de GitHub en AI Studio</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1.5 leading-relaxed">
              <li>Mira arriba a la derecha de AI Studio, <strong>justo al costado del ícono de GitHub</strong> donde hiciste clic.</li>
              <li>Busca el botón que dice <strong>Deploy app</strong> o el ícono de <strong>Compartir (Share app)</strong> (no el de GitHub).</li>
              <li>Al activarlo en modo público (Public), recién se encenderá el enlace <code>{defaultPublicUrl}</code>.</li>
              <li><strong>Nota importante:</strong> Cada vez que hagas cambios nuevos (como los códigos Unitario, Caja, Pack y Display que acabamos de agregar), vuelve a darle al botón de <strong>GitHub → Push / Update</strong> para actualizar tu proyecto <em>Rosa Elena</em>.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* SECTION 1: LIVE ONLINE / OFFLINE & CLOUD SYNC STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-emerald-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  1. ¿Funciona Online y Offline? ¡Sí, ambos!
                </h2>
                <p className="text-xs text-slate-500">
                  Estado actual del dispositivo: <strong className={isOnline ? 'text-emerald-700' : 'text-amber-700'}>{isOnline ? 'CONECTADO A INTERNET (ONLINE)' : 'SIN SEÑAL (MODO OFFLINE ACTIVO)'}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span>Cuando el vendedor NO tiene señal (Offline)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                El vendedor abre la App instalada en su celular, ve toda su ruta de lunes a sábado, busca productos por código, genera el ticket en Soles y lo imprime por Bluetooth sin necesitar internet.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span>Cuando recupera internet (Online)</span>
              </div>
              <p className="text-emerald-900 leading-relaxed">
                Los pedidos guardados en el teléfono se sincronizan con la base de datos central en <strong>Google Cloud Firestore</strong> y el supervisor puede verlos desde su computadora.
              </p>
            </div>
          </div>

          {/* Cloud Sync Control Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {firebaseUser
                    ? `Nube Conectada: ${firebaseUser.email}`
                    : 'Nube Firebase Lista para Conectar'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {lastSyncedAt
                  ? `Última sincronización: ${lastSyncedAt} · Pendientes offline: ${pendingOfflineCount}`
                  : `${customers.length} clientes, ${products.length} productos, ${salesUsers.length} vendedores y ${orders.length} pedidos listos.`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con la Nube Ahora'}</span>
              </button>
              {firebaseUser && (
                <button
                  onClick={signOutGoogleCloud}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Desvincular
                </button>
              )}
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}
        </div>

        {/* SECTION 2: STANDALONE URL & MOBILE PWA INSTALLATION */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                2. Usar Fuera de Gemini (Enlace Directo)
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Una vez que presiones el botón <strong>Publish</strong> arriba a la derecha (o publiques en Vercel/Firebase), verifica o pega aquí tu enlace activo para compartirlo por WhatsApp:
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customAppUrl}
                  onChange={(e) => handleSaveCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  onClick={() => handleCopy(publicAppUrl, 'url')}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedId === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'url' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              {urlSaved && (
                <div className="text-[11px] text-emerald-700 font-semibold">
                  ✓ Enlace guardado para enviar por WhatsApp
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-1">
              <div className="font-bold text-slate-800">Pasos para tus vendedores:</div>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Primero activa el botón <strong>Publish</strong> en la esquina superior derecha de AI Studio.</li>
                <li>Envíales el enlace por WhatsApp con el botón verde de arriba.</li>
                <li>Al abrirlo en su celular, tocan <strong>"Instalar App"</strong> en la barra superior.</li>
                <li>Ingresan con el <strong>Usuario y Contraseña</strong> que les creaste en la pestaña <em>Fuerza de Ventas</em>.</li>
              </ol>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <a
              href={publicAppUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Probar Enlace en Pestaña Nueva</span>
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 3: AUTOMATION SCRIPTS & OWN HOSTING GUIDE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-bold text-slate-900">
              3. Automatización Generada para Publicación Propia (`deploy.sh` y `firebase.json`)
            </h2>
          </div>
          <a
            href={firebaseConsoleUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Abrir Consola Firebase del Proyecto</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Ya he generado en el código del proyecto los archivos de automatización (<code>firebase.json</code>, <code>.firebaserc</code>, <code>firestore.rules</code> y <code>deploy.sh</code>). Si descargas el código a tu computadora o repositorio de GitHub, puedes publicarlo en tu propio dominio con un solo comando:
        </p>

        <div className="relative bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
          <button
            onClick={() => handleCopy(deployScriptCode, 'script')}
            className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
          >
            {copiedId === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'script' ? 'Copiado' : 'Copiar Script'}</span>
          </button>
          <pre className="leading-relaxed">{deployScriptCode}</pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Opción 1: Botón "Deploy" Arriba</span>
            </div>
            <p className="text-slate-600">
              En la esquina superior derecha de AI Studio puedes hacer clic en <strong>Share / Deploy to Cloud Run</strong> para mantener tu servidor web activo 24/7 sin configurar nada en tu PC.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span>Opción 2: Firebase Hosting</span>
            </div>
            <p className="text-slate-600">
              Ejecuta <code>npm run deploy</code> desde tu computadora. Publica la web estática PWA y las reglas de seguridad directamente en <code>gen-lang-client-0265265513.web.app</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Usuarios y Contraseñas</span>
            </div>
            <p className="text-slate-600">
              Tus vendedores ya pueden entrar con el usuario y clave creados en la pestaña <strong>Fuerza de Ventas</strong>. Si además deseas login por correo en Firebase Console, activa <em>Authentication &gt; Email/Password</em>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
