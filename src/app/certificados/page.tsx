
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, Layers, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { CitySelector } from '@/components/city-selector';


const CertificateCard = () => (
    <Card className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg border-border/50">
      <div className="relative h-48 w-full">
        <Image
          src="https://placehold.co/600x400.png"
          alt="Curso Pá Carregadeira"
          layout="fill"
          objectFit="cover"
          data-ai-hint="loader machine"
        />
      </div>
      <CardContent className="p-6 bg-card">
        <h3 className="text-xl font-bold mb-4 text-center">PÁ CARREGADEIRA</h3>
        <div className="space-y-3 text-muted-foreground mb-6">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-primary" />
            <span>8 aulas em vídeo</span>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <span>0 materiais</span>
          </div>
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-primary" />
            <span>5 módulos</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full">ACESSAR</Button>
          <Button size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 hover:text-primary">CERTIFICADO</Button>
        </div>
      </CardContent>
    </Card>
  );

export default function CertificadosPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCertificates] = useState(false); // Mude para false para ver o estado vazio
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const authStatus = sessionStorage.getItem('isAuthenticated') === 'true';
    if (!authStatus) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    }
  }, [router]);

  if (!isClient || !isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 lg:px-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Meus Certificados</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CitySelector />
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={avatar ?? "https://placehold.co/36x36.png"}
                alt="@user"
                data-ai-hint="man face"
              />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
        {hasCertificates ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CertificateCard />
            {/* Adicione mais <CertificateCard /> aqui para mais certificados */}
          </div>
        ) : (
          <Card className="w-full max-w-md border-0 shadow-none">
            <CardContent className="flex flex-col items-center justify-center space-y-6 p-10 text-center">
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Nenhum certificado encontrado
                </h2>
                <p className="text-muted-foreground">
                  Você ainda não possui nenhum certificado.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
