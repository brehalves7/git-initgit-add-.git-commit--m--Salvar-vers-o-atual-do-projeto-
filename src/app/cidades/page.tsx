
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getCities, addCity, deleteCity, City } from './data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CitySelector } from '@/components/city-selector';

export default function CidadesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [newCityName, setNewCityName] = useState('');
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
      setCities(getCities());
    }
  }, [router]);
  
  useEffect(() => {
    if (isClient) {
      const handleCitiesChange = () => {
          setCities(getCities());
      };
      window.addEventListener('citiesDataChanged', handleCitiesChange);
      return () => {
          window.removeEventListener('citiesDataChanged', handleCitiesChange);
      };
    }
  }, [isClient]);

  const handleAddCity = () => {
    if (!newCityName.trim()) {
      toast({ title: "Erro", description: "O nome da cidade não pode estar vazio.", variant: "destructive" });
      return;
    }
    if (cities.some(city => city.name.toLowerCase() === newCityName.trim().toLowerCase())) {
        toast({ title: "Erro", description: "Esta cidade já está cadastrada.", variant: "destructive" });
        return;
    }
    addCity(newCityName.trim());
    setNewCityName('');
    toast({ title: "Sucesso!", description: "Cidade adicionada com sucesso." });
  };
  
  const handleDeleteCity = (id: number) => {
    if (cities.length <= 1) {
        toast({ title: "Atenção", description: "Não é possível remover a última cidade.", variant: "destructive" });
        return;
    }
    deleteCity(id);
    toast({ title: "Sucesso!", description: "Cidade removida com sucesso." });
  };


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
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Cidades</h1>
                <p className="text-sm text-muted-foreground">Gerencie as cidades de atuação</p>
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
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Adicionar Nova Cidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="city-name">Nome da Cidade</Label>
                        <Input 
                            id="city-name" 
                            placeholder="Ex: Belém/PA" 
                            value={newCityName}
                            onChange={(e) => setNewCityName(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleAddCity} className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Cidade
                    </Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Cidades Cadastradas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">Nenhuma cidade cadastrada.</TableCell>
                                    </TableRow>
                                ) : (
                                    cities.map(city => (
                                        <TableRow key={city.id}>
                                            <TableCell className="font-medium">{city.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteCity(city.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
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
      </main>
    </div>
  );
}
