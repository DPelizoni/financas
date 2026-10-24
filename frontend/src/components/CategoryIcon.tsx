import {
  Award,
  Baby,
  Banknote,
  Beer,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Car,
  Coffee,
  Coins,
  CreditCard,
  Dumbbell,
  FileText,
  Film,
  Flame,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  KeyRound,
  Landmark,
  Laptop,
  LineChart,
  LucideIcon,
  Music,
  PartyPopper,
  PawPrint,
  Percent,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Receipt,
  Scissors,
  Shield,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sofa,
  Store,
  TrendingDown,
  TrendingUp,
  Tv,
  Undo2,
  Users,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  Droplet,
} from "lucide-react";
import { CategoryType } from "@/types/category";

// A ordem importa: regras mais específicas vêm antes das genéricas
// (ex.: "renda fixa" é investimento, enquanto "renda" sozinha é receita).
const ICON_RULES: Array<[RegExp, LucideIcon]> = [
  [/invest|aplica|renda (fixa|variavel)|acoes|\bfii|tesouro|\bcdb|\blci|\blca|cripto|bolsa/, LineChart],
  [/dividend|provento|juros|rendimento/, Coins],
  [/poupanca|reserva|economi|cofrinho/, PiggyBank],
  [/bonus|bonific|premio|\bplr\b|\b13/, Award],
  [/salario|holerite|pro.?labore|renda/, Wallet],
  [/freela|servico prestado|trabalho|emprego|negocio|empresa/, Briefcase],
  [/reembolso|estorno|devoluc|restitui/, Undo2],
  [/venda|vendas|comercio|loja/, Store],
  [/aluguel|aluguer|condominio|moradia|casa|\blar\b|habitac|iptu|financiamento imob/, Home],
  [/energia|\bluz\b|eletric/, Zap],
  [/agua|saneamento/, Droplet],
  [/\bgas\b|botijao/, Flame],
  [/internet|wi.?fi|banda larga/, Wifi],
  [/celular|telefon|operadora/, Smartphone],
  [/streaming|assinatura|netflix|spotify|\btv\b/, Tv],
  [/combustivel|gasolina|etanol|alcool|diesel|\bposto/, Fuel],
  [/uber|\b99\b|onibus|metro|transporte|passagem/, Bus],
  [/carro|veiculo|automov|ipva|estacionamento|pedagio|moto/, Car],
  [/bicicleta|\bbike/, Bike],
  [/mercado|supermercado|compras|feira|hortifruti|padaria/, ShoppingCart],
  [/delivery|ifood|lanche|pizza/, Pizza],
  [/cafe|cafeteria/, Coffee],
  [/\bbar\b|bebida|cerveja/, Beer],
  [/restaurante|alimenta|comida|refeic|almoco|jantar/, Utensils],
  [/farmacia|remedio|medicamento/, Pill],
  [/saude|medic|hospital|consulta|exame|dentist|odonto|plano de saude|convenio/, HeartPulse],
  [/academia|esporte|ginastica|crossfit|fitness|treino/, Dumbbell],
  [/beleza|cabelo|salao|barbe|estetica|cosmetic/, Scissors],
  [/educa|escola|faculdade|curso|mensalidade|ensino|universidade/, GraduationCap],
  [/livro|leitura|papelaria/, BookOpen],
  [/viagem|viagens|ferias|hotel|hospedagem|aereo|turismo/, Plane],
  [/cinema|filme|teatro|show/, Film],
  [/musica/, Music],
  [/lazer|entretenimento|diversao|jogo|game/, Gamepad2],
  [/festa|evento|comemora/, PartyPopper],
  [/presente|doac|gift/, Gift],
  [/roupa|vestuario|calcado|sapato|moda/, Shirt],
  [/\bpet|animal|veterinar|racao|cachorro|gato/, PawPrint],
  [/filho|crianca|bebe|infantil|creche/, Baby],
  [/familia|pessoal/, Users],
  [/movel|moveis|decorac|utilidade/, Sofa],
  [/manutenc|reparo|conserto|reforma/, Wrench],
  [/obra|construc|ferrament/, Hammer],
  [/eletronic|computador|notebook|informatica|tecnologia|software/, Laptop],
  [/seguro|protec/, Shield],
  [/imposto|tributo|\bir\b|irpf|taxa|darf|inss/, Landmark],
  [/cartao|credito|fatura/, CreditCard],
  [/emprestimo|financiamento|divida|parcela|consorcio/, Building2],
  [/tarifa|banco|bancari|juros pagos|\biof\b/, Percent],
  [/document|cartorio|contabil/, FileText],
  [/conta|boleto/, Receipt],
  [/chave|chaveiro|seguranca/, KeyRound],
  [/transfer|pix|saque|deposito|dinheiro/, Banknote],
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export const getCategoryIcon = (nome: string, tipo?: CategoryType): LucideIcon => {
  const normalized = normalize(nome);
  const match = ICON_RULES.find(([pattern]) => pattern.test(normalized));
  if (match) return match[1];
  return tipo === "RECEITA" ? TrendingUp : TrendingDown;
};

interface CategoryIconProps {
  nome: string;
  tipo?: CategoryType;
  cor: string;
  size?: "sm" | "md";
}

export default function CategoryIcon({ nome, tipo, cor, size = "md" }: CategoryIconProps) {
  const IconComponent = getCategoryIcon(nome, tipo);
  const isSmall = size === "sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
        isSmall ? "h-7 w-7" : "h-10 w-10"
      }`}
      style={{ backgroundColor: cor }}
      title={nome}
    >
      <IconComponent size={isSmall ? 14 : 20} strokeWidth={2.25} />
    </div>
  );
}
