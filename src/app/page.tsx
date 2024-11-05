"use client"

import axios from 'axios';
import { useEffect, useState } from 'react';
import VoiceRecognition from '../../components/VoiceRecognition';

interface Product {
  c_id: number;
  c_name: string;
  c_price: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await axios.get<Product[]>('http://localhost:3001/api/products');
      setProducts(response.data);
    };
    
    fetchProducts();
    
  }, []);
  
  return (
    <div>
      
      <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
      }}>
      <h1>상품 목록</h1>
      <VoiceRecognition />
    </div>
      <ul>  {/* Fixed: Added closing parenthesis for useEffect */}
        {products.map((product) => (
          <li key={product.c_id}>
            {product.c_name} ({product.c_price}원)
          </li>
        ))}
      </ul>
      
    </div>
  
  );
}



