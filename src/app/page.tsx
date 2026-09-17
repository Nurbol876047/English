import { ArenaScene } from '@/components/scene/ArenaScene';
import { HUD } from '@/components/ui/HUD';
import { ElementVideo } from '@/components/ui/ElementVideo';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';

export default function Home() {
  return (
    <main className="w-screen h-screen relative overflow-hidden bg-black">
      <VideoBackdrop src="/videos/bg-avatar.mp4" poster="/videos/bg-avatar-poster.jpg" dim={0.6} />
      <ArenaScene />
      <HUD />
      <ElementVideo />
    </main>
  );
}
