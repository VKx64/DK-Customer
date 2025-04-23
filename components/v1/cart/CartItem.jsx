"use client";
import React from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"

const CartItem = ({
  product = {
    id: '1',
    name: 'Product Name',
    price: 99.99,
    stock: 10,
    image: '/placeholder.jpg',
    quantity: 1
  },
  onQuantityChange,
  onRemove,
  onCheckChange,
  checked = false
}) => {
  const handleIncrement = () => {
    if (product.quantity < product.stock) {
      onQuantityChange && onQuantityChange(product.id, product.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (product.quantity > 1) {
      onQuantityChange && onQuantityChange(product.id, product.quantity - 1);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= product.stock) {
      onQuantityChange && onQuantityChange(product.id, value);
    }
  };

  const totalPrice = product.price * product.quantity;

  return (
    <div className="flex items-center gap-4 py-4 border-b">
      <div className="flex items-center">
        <Checkbox
          id={`select-${product.id}`}
          checked={checked}
          onCheckedChange={(checked) => onCheckChange && onCheckChange(product.id, checked)}
          className="mr-2"
        />
      </div>

      <div className="flex-shrink-0 relative h-20 w-20 rounded-md overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-grow grid gap-1">
        <h3 className="font-medium text-sm md:text-base">{product.name}</h3>
        <div className="text-sm text-muted-foreground">
          ${product.price.toFixed(2)} / item
        </div>
        <div className="text-sm text-muted-foreground">
          Stock: {product.stock} available
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={handleDecrement}
            disabled={product.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="text"
            value={product.quantity}
            onChange={handleInputChange}
            className="h-8 w-12 text-center rounded-none"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={handleIncrement}
            disabled={product.quantity >= product.stock}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="font-medium">
          ${totalPrice.toFixed(2)}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove && onRemove(product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default CartItem