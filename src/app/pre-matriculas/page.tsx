"use client";

import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Check,
  ArrowUpDown,
  FileDown,
  Phone,
  MessageCircle,
  Pencil,
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PreMatriculaData,
  addPreMatricula,
  updatePreMatriculaData,
  getPreMatriculas,
  deletePreMatricula,
} from "./data";
import { Badge } from "@/components/ui/badge";
import { CitySelector } from "@/components/city-selector";

type SortKey = keyof PreMatriculaData;

const validateCpf = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++)
    sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++)
    sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

const maskCpf = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .substring(0, 14);
};

const maskWhatsapp = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

let lastId = 0;
const generateId = () => {
  lastId++;
  return String(lastId + 206682);
};

const StatusBadge = ({ status }: { status: PreMatriculaData["status"] }) => {
  const statusClasses = {
    pre: "border-blue-500 text-blue-500",
    matriculado: "bg-green-500 text-white",
    aguardando_pagamento: "border-yellow-500 text-yellow-500",
    ativo: "bg-green-100 text-green-800",
    inativo: "bg-red-100 text-red-800",
  };

  const statusText = {
    pre: "Pré-matrícula",
    matriculado: "Matriculado",
    aguardando_pagamento: "Aguardando Pagamento",
    ativo: "Ativo",
    inativo: "Inativo",
  };

  const variant =
    status === "pre" || status === "aguardando_pagamento"
      ? "outline"
      : "default";

  return (
    <Badge variant={variant} className={statusClasses[status]}>
      {statusText[status]}
    </Badge>
  );
};

export default function PreMatriculasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [matriculas, setMatriculas] = useState<PreMatriculaData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Estado para o termo de pesquisa

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sendWhatsapp, setSendWhatsapp] = useState(true);

  const [editingMatricula, setEditingMatricula] =
    useState<PreMatriculaData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingMatricula, setDeletingMatricula] =
    useState<PreMatriculaData | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  }>({ key: "criado", direction: "descending" });

  useEffect(() => {
    setIsClient(true);
    const authStatus = sessionStorage.getItem("isAuthenticated") === "true";
    const roleFromSession = sessionStorage.getItem("userRole");
    if (!authStatus) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      setUserRole(roleFromSession);
      const savedAvatar = localStorage.getItem("userAvatar");
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    }
  }, [router]);

  useEffect(() => {
    if (selectedCity && isClient) {
      const data = getPreMatriculas(selectedCity);
      setMatriculas(data);
      if (data.length > 0) {
        lastId = Math.max(...data.map((item) => parseInt(item.id, 10)));
      } else {
        lastId = 206682;
      }
    }
  }, [selectedCity, isClient]);

  useEffect(() => {
    if (isClient) {
      const handleMatriculaEvent = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.city === selectedCity) {
          setMatriculas(getPreMatriculas(selectedCity));
        }
      };
      window.addEventListener("matriculaCriada", handleMatriculaEvent);
      window.addEventListener("matriculaAtualizada", handleMatriculaEvent);
      window.addEventListener("preMatriculaDataChanged", handleMatriculaEvent);

      return () => {
        window.removeEventListener("matriculaCriada", handleMatriculaEvent);
        window.removeEventListener("matriculaAtualizada", handleMatriculaEvent);
        window.removeEventListener(
          "preMatriculaDataChanged",
          handleMatriculaEvent
        );
      };
    }
  }, [selectedCity, isClient]);

  const handleCpfChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCpf(e.target.value));
  };

  const handleWhatsappChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(maskWhatsapp(e.target.value));
  };

  const handleCreateMatricula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) {
      toast({
        title: "Erro",
        description: "Selecione uma cidade primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCpf(cpf)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um CPF válido.",
        variant: "destructive",
      });
      return;
    }

    if (
      matriculas.some(
        (m) => m.cpf.replace(/[^\d]/g, "") === cpf.replace(/[^\d]/g, "")
      )
    ) {
      toast({
        title: "Erro",
        description: "Este CPF já está cadastrado nesta cidade.",
        variant: "destructive",
      });
      return;
    }

    const newMatricula: PreMatriculaData = {
      id: generateId(),
      nome,
      cpf,
      whatsapp,
      status: "pre",
      local: selectedCity,
      criado: new Date()
        .toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace(",", ""),
    };

    addPreMatricula(selectedCity, newMatricula);
    setMatriculas(getPreMatriculas(selectedCity));

    setNome("");
    setCpf("");
    setWhatsapp("");
    setSendWhatsapp(true);
    toast({
      title: "Sucesso!",
      description: "Pré-matrícula criada com sucesso.",
    });
  };

  // Função para filtrar as matrículas baseada no termo de pesquisa
  const filteredMatriculas = useMemo(() => {
    if (!searchTerm) return matriculas;

    const term = searchTerm.toLowerCase();
    return matriculas.filter(
      (matricula) =>
        matricula.nome.toLowerCase().includes(term) ||
        matricula.cpf.includes(term) ||
        matricula.whatsapp.includes(term) ||
        matricula.local.toLowerCase().includes(term) ||
        matricula.id.includes(term) ||
        matricula.status.toLowerCase().includes(term)
    );
  }, [matriculas, searchTerm]);

  const sortedMatriculas = useMemo(() => {
    let sortableItems = [...filteredMatriculas];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        let comparison = 0;

        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue, "pt-BR", {
            sensitivity: "base",
          });
        } else if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }

        return sortConfig.direction === "ascending" ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [filteredMatriculas, sortConfig]);

  const paginatedMatriculas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedMatriculas.slice(startIndex, endIndex);
  }, [sortedMatriculas, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedMatriculas.length / itemsPerPage);

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleEditClick = (matricula: PreMatriculaData) => {
    setEditingMatricula({ ...matricula });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (matricula: PreMatriculaData) => {
    setDeletingMatricula(matricula);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingMatricula || !selectedCity) return;

    deletePreMatricula(selectedCity, deletingMatricula.id);
    setMatriculas(getPreMatriculas(selectedCity));

    toast({
      title: "Sucesso!",
      description: `Pré-matrícula de "${deletingMatricula.nome}" excluída.`,
    });
    setIsDeleteDialogOpen(false);
    setDeletingMatricula(null);
  };

  const handleUpdateMatricula = () => {
    if (!editingMatricula || !selectedCity) return;

    if (!validateCpf(editingMatricula.cpf)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um CPF válido para atualizar.",
        variant: "destructive",
      });
      return;
    }

    if (
      matriculas.some(
        (m) =>
          m.id !== editingMatricula.id &&
          m.cpf.replace(/[^\d]/g, "") ===
            editingMatricula.cpf.replace(/[^\d]/g, "")
      )
    ) {
      toast({
        title: "Erro",
        description: "Este CPF já está cadastrado em outra pré-matrícula.",
        variant: "destructive",
      });
      return;
    }

    updatePreMatriculaData(selectedCity, editingMatricula.id, editingMatricula);
    setMatriculas(getPreMatriculas(selectedCity));

    setIsEditDialogOpen(false);
    setEditingMatricula(null);
    toast({
      title: "Sucesso!",
      description: "Pré-matrícula atualizada com sucesso.",
    });
  };

  const handleEditCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingMatricula) {
      const maskedCpf = maskCpf(e.target.value);
      setEditingMatricula({ ...editingMatricula, cpf: maskedCpf });
    }
  };

  const handleEditWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingMatricula) {
      const maskedWhatsapp = maskWhatsapp(e.target.value);
      setEditingMatricula({ ...editingMatricula, whatsapp: maskedWhatsapp });
    }
  };

  const downloadFile = (
    content: string,
    fileName: string,
    contentType: string
  ) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = [
      "#ID",
      "Nome",
      "Status",
      "Local",
      "CPF",
      "Whatsapp",
      "Criado",
    ];
    const rows = sortedMatriculas.map((m) =>
      [m.id, m.nome, m.status, m.local, m.cpf, m.whatsapp, m.criado].join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    downloadFile(csvContent, "pre-matriculas.csv", "text/csv");
  };

  const handleExportExcel = () => {
    const headers = [
      "#ID",
      "Nome",
      "Status",
      "Local",
      "CPF",
      "Whatsapp",
      "Criado",
    ];
    const rows = sortedMatriculas.map((m) =>
      [m.id, m.nome, m.status, m.local, m.cpf, m.whatsapp, m.criado].join("\t")
    );
    const excelContent = [headers.join("\t"), ...rows].join("\n");
    downloadFile(
      excelContent,
      "pre-matriculas.xls",
      "application/vnd.ms-excel"
    );
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    (doc as any).autoTable({
      head: [["#ID", "Nome", "Status", "Local", "CPF", "Whatsapp", "Criado"]],
      body: sortedMatriculas.map((m) => [
        m.id,
        m.nome,
        m.status,
        m.local,
        m.cpf,
        m.whatsapp,
        m.criado,
      ]),
    });
    doc.save("pre-matriculas.pdf");
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset para a primeira página ao pesquisar
  };

  if (!isClient || !isAuthenticated) {
    return null;
  }

  const startRecord = (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(
    currentPage * itemsPerPage,
    sortedMatriculas.length
  );

  return (
    <>
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
                <UserPlus className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-lg font-bold">Pré-Matrículas</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CitySelector onCityChange={setSelectedCity} />
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
                <CardTitle className="flex items-center gap-2">
                  <Plus size={24} /> Criar Pré-Matrícula
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMatricula} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">* Nome:</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">* CPF:</Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={handleCpfChange}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">* Whatsapp:</Label>
                    <Input
                      id="whatsapp"
                      value={whatsapp}
                      onChange={handleWhatsappChange}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="sendWhatsapp"
                      checked={sendWhatsapp}
                      onCheckedChange={setSendWhatsapp}
                    />
                    <Label htmlFor="sendWhatsapp">
                      Enviar confirmação de pré matrícula via whatsapp?
                    </Label>
                  </div>
                  <div className="pt-4">
                    <Button type="submit" className="w-full">
                      <Check className="mr-2 h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportExcel}
                    >
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                    >
                      PDF
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Pesquisa..."
                        className="h-9 pl-8"
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Mostrando
                    </span>
                    <Select
                      defaultValue="25"
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="1000">1000</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                      registros
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#ID</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestSort("nome")}
                          >
                            Nome
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestSort("status")}
                          >
                            Status
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestSort("local")}
                          >
                            Local
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestSort("cpf")}
                          >
                            CPF
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestSort("whatsapp")}
                          >
                            Whatsapp
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestSort("criado")}
                          >
                            Criado
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMatriculas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            {searchTerm
                              ? "Nenhum resultado encontrado para sua pesquisa."
                              : "Não há resultados para serem listados."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedMatriculas.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.id}
                            </TableCell>
                            <TableCell>{item.nome}</TableCell>
                            <TableCell>
                              <StatusBadge status={item.status} />
                            </TableCell>
                            <TableCell>{item.local}</TableCell>
                            <TableCell>{item.cpf}</TableCell>
                            <TableCell>{item.whatsapp}</TableCell>
                            <TableCell>{item.criado}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  asChild
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <a
                                    href={`tel:${item.whatsapp.replace(
                                      /\D/g,
                                      ""
                                    )}`}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <a
                                    href={`https://wa.me/55${item.whatsapp.replace(
                                      /\D/g,
                                      ""
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditClick(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {userRole === "mestre" && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDeleteClick(item)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {startRecord} a {endRecord} de{" "}
                    {sortedMatriculas.length} registros
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pré-matrícula</DialogTitle>
            <DialogDescription>
              Faça alterações nos dados da pré-matrícula aqui. Clique em salvar
              quando terminar.
            </DialogDescription>
          </DialogHeader>
          {editingMatricula && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nome" className="text-right">
                  Nome
                </Label>
                <Input
                  id="edit-nome"
                  value={editingMatricula.nome}
                  onChange={(e) =>
                    setEditingMatricula({
                      ...editingMatricula,
                      nome: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cpf" className="text-right">
                  CPF
                </Label>
                <Input
                  id="edit-cpf"
                  value={editingMatricula.cpf}
                  onChange={handleEditCpfChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-whatsapp" className="text-right">
                  Whatsapp
                </Label>
                <Input
                  id="edit-whatsapp"
                  value={editingMatricula.whatsapp}
                  onChange={handleEditWhatsappChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleUpdateMatricula}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá excluir permanentemente
              a pré-matrícula de
              <span className="font-bold"> {deletingMatricula?.nome}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
