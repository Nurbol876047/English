import { ArenaScene } from '@/components/scene/ArenaScene';
import { HUD } from '@/components/ui/HUD';
import { ElementVideo } from '@/components/ui/ElementVideo';
import { ElementBackdrop } from '@/components/ui/ElementBackdrop';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';

export default function Home() {
  return (
    <main className="w-screen h-screen relative overflow-hidden bg-black">
      <VideoBackdrop src="/videos/bg-main.mp4" poster="/videos/bg-main-poster.jpg" dim={0.6} />
      {/* Видео стихии поверх обычного фона — играет один раз при активации элемента */}
      <ElementBackdrop />
      <ArenaScene />
      <HUD />
      <ElementVideo />
    </main>
  );
}
