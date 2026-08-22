export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  sex: string;
  maritalStatus: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
  lastAppt: string;
  goal: string;
}

export const mockPatients: Patient[] = [
  { id: "1", name: "Ana Beatriz Silva", cpf: "123.456.789-00", birthDate: "1990-05-12", phone: "(11) 99999-0001", sex: "Feminino", maritalStatus: "Solteira", email: "ana@email.com", status: "active", createdAt: "2026-01-15", lastAppt: "2026-07-01", goal: "Perda de peso" },
  { id: "2", name: "Carlos Eduardo Lima", cpf: "987.654.321-00", birthDate: "1978-11-23", phone: "(11) 99999-0002", sex: "Masculino", maritalStatus: "Casado", email: "carlos@email.com", status: "active", createdAt: "2026-02-20", lastAppt: "2026-06-28", goal: "Ganho de massa" },
  { id: "3", name: "Mariana Oliveira Costa", cpf: "456.789.123-00", birthDate: "1995-08-03", phone: "(11) 99999-0003", sex: "Feminino", maritalStatus: "Casada", email: "mariana@email.com", status: "active", createdAt: "2026-03-10", lastAppt: "2026-07-03", goal: "Reeducação alimentar" },
  { id: "4", name: "Roberto Almeida Neto", cpf: "789.123.456-00", birthDate: "1982-02-18", phone: "(11) 99999-0004", sex: "Masculino", maritalStatus: "Divorciado", email: "roberto@email.com", status: "inactive", createdAt: "2026-01-05", lastAppt: "2026-05-20", goal: "Controle colesterol" },
  { id: "5", name: "Juliana Ferreira Santos", cpf: "321.654.987-00", birthDate: "2000-12-30", phone: "(11) 99999-0005", sex: "Feminino", maritalStatus: "Solteira", email: "juliana@email.com", status: "active", createdAt: "2026-04-01", lastAppt: "2026-07-05", goal: "Definição muscular" },
  { id: "6", name: "Pedro Henrique Martins", cpf: "654.321.987-00", birthDate: "1975-06-08", phone: "(11) 99999-0006", sex: "Masculino", maritalStatus: "Casado", email: "pedro@email.com", status: "active", createdAt: "2026-03-22", lastAppt: "2026-06-30", goal: "Diabetes" },
  { id: "7", name: "Luciana Mendes Rocha", cpf: "159.753.486-00", birthDate: "1988-09-14", phone: "(11) 99999-0007", sex: "Feminino", maritalStatus: "Solteira", email: "luciana@email.com", status: "active", createdAt: "2026-05-12", lastAppt: "2026-07-02", goal: "Perda de peso" },
  { id: "8", name: "Fernando Augusto Lima", cpf: "951.753.852-00", birthDate: "1992-04-25", phone: "(11) 99999-0008", sex: "Masculino", maritalStatus: "Solteiro", email: "fernando@email.com", status: "inactive", createdAt: "2026-02-14", lastAppt: "2026-04-10", goal: "Hipertrofia" },
];
