
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Upload, Check, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CitySelector } from '@/components/city-selector';


export default function DadosGeraisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
        setAvatarPreview(savedAvatar);
      }
      const savedName = sessionStorage.getItem('userName');
      if(savedName) {
        setName(savedName);
      }
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        setEmail(currentUser.email);
      }
    }
  }, [router]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        toast({ title: 'Erro', description: 'Nenhum usuário autenticado.', variant: 'destructive'});
        return;
    }

    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const dataToUpdate: { name: string; avatar?: string } = { name };

        if (avatarPreview) {
            localStorage.setItem('userAvatar', avatarPreview);
            dataToUpdate.avatar = avatarPreview;
        }
        if (name) {
            sessionStorage.setItem('userName', name);
        }
        
        await updateDoc(userDocRef, dataToUpdate);

        window.dispatchEvent(new Event('storage'));
        
        toast({
            title: 'Sucesso!',
            description: 'Seus dados foram salvos com sucesso.',
        });

    } catch (error) {
        console.error("Error updating profile: ", error);
        toast({
            title: 'Erro',
            description: 'Não foi possível salvar os dados.',
            variant: 'destructive'
        });
    }
  }

  if (!isClient || !isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 lg:px-6">
          <div className="flex w-full items-center justify-between">
              <div className='flex items-center gap-4'>
                  <Button variant="outline" size="icon" asChild>
                      <Link href="/">
                      <ArrowLeft className="h-4 w-4" />
                      </Link>
                  </Button>
                  <div className="flex items-center gap-3">
                      <User className="h-6 w-6 text-primary" />
                      <div>
                      <h1 className="text-lg font-bold">Perfil</h1>
                      <p className='text-sm text-muted-foreground'>Edite seus dados</p>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                <CitySelector />
                 <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarPreview ?? "https://placehold.co/36x36.png"} alt="@user" data-ai-hint="man face" />
                  <AvatarFallback>B</AvatarFallback>
                </Avatar>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
            <Tabs defaultValue="gerais">
                <TabsList>
                    <TabsTrigger value="gerais">Dados Gerais</TabsTrigger>
                    <TabsTrigger value="senha" onClick={() => router.push('/perfil/alterar-senha')}>Alterar Senha</TabsTrigger>
                </TabsList>
                <TabsContent value="gerais">
                    <Card className="mt-4">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                <div className="md:col-span-2 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Perfil</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">*Nome:</Label>
                                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">*Email:</Label>
                                                <Input id="email" type="email" value={email} readOnly disabled />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cpf">CPF:</Label>
                                                <Input id="cpf" placeholder="Informe seu CPF" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="birthdate">Data de Nascimento:</Label>
                                                <Input id="birthdate" type="date" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Contato</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Telefone fixo:</Label>
                                                <Input id="phone" placeholder="Informe o Telefone" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cellphone">Celular:</Label>
                                                <Input id="cellphone" placeholder="Informe o Celular" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                     <div>
                                        <h3 className="text-lg font-semibold mb-4 text-center md:text-left">Avatar</h3>
                                        <div className="flex flex-col items-center gap-4">
                                            <Avatar className="h-40 w-40">
                                                <AvatarImage src={avatarPreview ?? "https://placehold.co/160x160.png"} alt="User Avatar" data-ai-hint="man face" />
                                                <AvatarFallback>B</AvatarFallback>
                                            </Avatar>
                                            <Input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                               <FileImage className="mr-2 h-4 w-4" />
                                                Selecionar imagem
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <div className="flex justify-end mt-8">
                                <Button onClick={handleSave}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Salvar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="senha">
                 {/* This content is now on its own page */}
              </TabsContent>
            </Tabs>
        </main>
    </div>
  );
}
