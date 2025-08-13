
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, File, Video, Upload, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CitySelector } from '@/components/city-selector';

interface Material {
  id: number;
  name: string;
  type: 'pdf' | 'video';
  file?: File;
}

export default function MaterialEstudoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialName, setMaterialName] = useState('');
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
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
      // Load materials from local storage
      const savedMaterials = localStorage.getItem('studyMaterials');
      if (savedMaterials) {
        setMaterials(JSON.parse(savedMaterials));
      }
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated && isClient) {
      localStorage.setItem('studyMaterials', JSON.stringify(materials));
    }
  }, [materials, isAuthenticated, isClient]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'video') => {
    const file = event.target.files?.[0];
    if (file && materialName) {
      const newMaterial: Material = {
        id: Date.now(),
        name: materialName,
        type: type,
        file: file,
      };
      setMaterials(prev => [...prev, newMaterial]);
      setMaterialName('');
      toast({
        title: 'Sucesso!',
        description: `Material "${materialName}" adicionado.`,
      });
    } else if (!materialName) {
        toast({
            title: 'Erro',
            description: 'Por favor, insira um nome para o material antes de selecionar o arquivo.',
            variant: 'destructive'
        })
    }
    // Reset file input
    if(event.target) event.target.value = '';
  };

  const handleDeleteMaterial = (id: number) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    toast({
        title: 'Sucesso',
        description: 'Material removido.'
    })
  }

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
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Material de Estudo</h1>
                <p className="text-sm text-muted-foreground">Adicione e gerencie os materiais</p>
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
      <main className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Novo Material</CardTitle>
                        <CardDescription>Selecione o tipo de material e envie o arquivo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="material-name">Nome do Material</Label>
                            <Input 
                                id="material-name" 
                                placeholder="Ex: Apostila Módulo 1"
                                value={materialName}
                                onChange={(e) => setMaterialName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="file"
                                ref={pdfInputRef}
                                onChange={(e) => handleFileChange(e, 'pdf')}
                                className="hidden"
                                accept="application/pdf"
                            />
                             <Button variant="outline" onClick={() => pdfInputRef.current?.click()}>
                                <File className="mr-2 h-4 w-4" /> Adicionar PDF
                            </Button>
                            
                            <Input
                                type="file"
                                ref={videoInputRef}
                                onChange={(e) => handleFileChange(e, 'video')}
                                className="hidden"
                                accept="video/*"
                            />
                            <Button variant="outline" onClick={() => videoInputRef.current?.click()}>
                                <Video className="mr-2 h-4 w-4" /> Adicionar Vídeo
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Materiais Cadastrados</CardTitle>
                        <CardDescription>Lista de todos os materiais de estudo disponíveis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {materials.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                Nenhum material cadastrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        materials.map((material) => (
                                            <TableRow key={material.id}>
                                                <TableCell className="font-medium">{material.name}</TableCell>
                                                <TableCell>
                                                    <span className="flex items-center gap-2">
                                                        {material.type === 'pdf' ? <File className="h-4 w-4 text-red-500"/> : <Video className="h-4 w-4 text-blue-500" />}
                                                        {material.type.toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                     <Button variant="ghost" size="icon">
                                                        <Download className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteMaterial(material.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
