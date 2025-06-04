
import { CineForm } from '@/components/cine-form/CineForm';

export default function ManagePage() {
  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-primary mb-2 mt-4">CineForm</h1>
      <p className="text-xl text-center text-muted-foreground mb-10">Gerencie sua coleção de filmes e séries com facilidade.</p>
      <CineForm />
    </main>
  );
}
