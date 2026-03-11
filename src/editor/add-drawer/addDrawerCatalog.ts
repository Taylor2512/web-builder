export type AddCategory = {
  id: string;
  label: string;
};

export type AddItem = {
  id: string;
  label: string;
  categoryId: AddCategory["id"];
};

export type AddCatalog = {
  categories: AddCategory[];
  items: AddItem[];
};

const categories: AddCategory[] = [
  { id: "text", label: "Textos" },
  { id: "images", label: "Imágenes" },
  { id: "buttons", label: "Botones" },
  { id: "strips", label: "Franjas" },
  { id: "decorative", label: "Decorativo" },
  { id: "box", label: "Cuadro" },
  { id: "galleries", label: "Galerías" },
  { id: "menu-anchor", label: "Menú y ancla" },
  { id: "contact-forms", label: "Contacto y formularios" },
  { id: "video-music", label: "Video y música" },
  { id: "interactive", label: "Interactivo" },
  { id: "lists", label: "Listas" },
  { id: "embed-code", label: "Código incrustado" },
  { id: "social", label: "Redes sociales" },
  { id: "payments", label: "Pagos" },
  { id: "cms", label: "CMS" },
];

const items: AddItem[] = [
  { id: "heading", label: "Título", categoryId: "text" },
  { id: "single-image", label: "Imagen", categoryId: "images" },
  { id: "primary-button", label: "Botón principal", categoryId: "buttons" },
  { id: "hero-strip", label: "Franja hero", categoryId: "strips" },
  { id: "shape", label: "Forma", categoryId: "decorative" },
  { id: "content-box", label: "Cuadro de contenido", categoryId: "box" },
  { id: "image-gallery", label: "Galería de imágenes", categoryId: "galleries" },
  { id: "top-menu", label: "Menú superior", categoryId: "menu-anchor" },
  { id: "contact-form", label: "Formulario de contacto", categoryId: "contact-forms" },
  { id: "video-player", label: "Reproductor de video", categoryId: "video-music" },
  { id: "accordion", label: "Acordeón", categoryId: "interactive" },
  { id: "feature-list", label: "Lista de características", categoryId: "lists" },
  { id: "html-embed", label: "HTML embebido", categoryId: "embed-code" },
  { id: "social-links", label: "Íconos sociales", categoryId: "social" },
  { id: "checkout-button", label: "Botón de pago", categoryId: "payments" },
  { id: "cms-list", label: "Lista dinámica", categoryId: "cms" },
];

export const ADD_DRAWER_CATALOG: AddCatalog = {
  categories,
  items,
};

export const getItemsByCategory = (categoryId: AddCategory["id"]): AddItem[] =>
  ADD_DRAWER_CATALOG.items.filter((item) => item.categoryId === categoryId);
