export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const products: Product[] = [
  {
    id: 'prod_Sqg1XWXk0Jq5V9',
    priceId: 'price_1RuyflKgTdc636Z9sCuOBwVS',
    name: 'frakt-bolt',
    description: 'Premium project management solution with advanced features',
    mode: 'payment'
  }
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): Product | undefined => {
  return products.find(product => product.priceId === priceId);
};