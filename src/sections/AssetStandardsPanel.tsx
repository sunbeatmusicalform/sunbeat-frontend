import type { ReactNode } from 'react'
import { ChevronDown, Film, Image, LayoutTemplate } from 'lucide-react'

function Guide({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-foreground/12 bg-white/45 open:bg-white/65">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold">
        {icon}<span className="flex-1">{title}</span><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-foreground/10 px-4 py-3 text-xs leading-relaxed text-muted-foreground">{children}</div>
    </details>
  )
}

export function AssetStandardsPanel() {
  return (
    <div className="rounded-3xl border-2 border-[#329fd7]/25 bg-[#329fd7]/7 p-4">
      <p className="text-sm font-black">Guia de assets da Atabaque</p>
      <p className="mb-3 mt-0.5 text-xs text-muted-foreground">Consulte antes de gerar ou compartilhar os arquivos finais.</p>
      <div className="space-y-2">
        <Guide title="Clipe para Spotify" icon={<Film className="h-4 w-4 text-[#329fd7]" />}>
          <ul className="list-inside list-disc space-y-1">
            <li>MP4, MOV ou MPG; apenas 1 faixa de vídeo e 1 faixa de áudio; duração máxima de 12 horas.</li>
            <li>Vídeo H.264 Perfil Alto, widescreen 16:9, frame rate nativo.</li>
            <li>Até 25 Mbps em 1080p ou 35 Mbps em 4K.</li>
            <li>Áudio AAC-LC, 192 Kbps ou superior, estéreo; multicanal não suportado.</li>
          </ul>
        </Guide>
        <Guide title="Thumb e cabeçalhos" icon={<LayoutTemplate className="h-4 w-4 text-[#329fd7]" />}>
          <ul className="list-inside list-disc space-y-1">
            <li>Thumb: 16:9, 1280 × 720, até 2 MB.</li>
            <li>Spotify: avatar mínimo 750 × 750; cabeçalho mínimo 2660 × 1140.</li>
            <li>YouTube: mínimo 2048 × 1152 e até 6 MB.</li>
            <li>Twitter/X: 1500 × 500.</li>
            <li>Facebook: ideal 851 × 315 sRGB JPG, abaixo de 100 KB; considerar cortes desktop/mobile.</li>
          </ul>
        </Guide>
        <Guide title="Capas por distribuidora" icon={<Image className="h-4 w-4 text-[#329fd7]" />}>
          O analisador acima compara automaticamente dimensão, formato e tamanho com Urban, Universal, Som Livre, ONErpm e Ingrooves. Perfil de cor, DPI, alpha, layers e compressão TIFF continuam sujeitos ao preflight técnico.
        </Guide>
      </div>
    </div>
  )
}
