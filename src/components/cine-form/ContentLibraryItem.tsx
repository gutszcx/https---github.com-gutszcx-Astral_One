// src/components/cine-form/ContentLibraryItem.tsx
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Film, Tv, Edit3, Trash2, Eye } from 'lucide-react';
import type { StoredCineItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContentLibraryItemProps {
  item: StoredCineItem;
  onEdit: (item: StoredCineItem) => void;
  onDelete: (itemId: string) => void;
  isDeleting: boolean;
}

export function ContentLibraryItem({ item, onEdit, onDelete, isDeleting }: ContentLibraryItemProps) {
  const mediaTypeIcon = item.contentType === 'movie' 
    ? <Film className="h-4 w-4 text-muted-foreground" /> 
    : <Tv className="h-4 w-4 text-muted-foreground" />;
  
  const mediaTypeLabel = item.contentType === 'movie' ? 'Filme' : 'Série';
  const lastUpdated = item.updatedAt ? formatDistanceToNow(item.updatedAt.toDate(), { addSuffix: true, locale: ptBR }) : 'N/A';

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader className="p-0 relative aspect-[2/3] w-full bg-muted">
        <Image
          src={item.capaPoster || `https://placehold.co/300x450.png?text=${encodeURIComponent(item.tituloOriginal)}`}
          alt={`Poster de ${item.tituloOriginal}`}
          layout="fill"
          objectFit="cover"
          className="rounded-t-md"
          data-ai-hint={item.contentType === 'movie' ? "movie poster" : "tv show poster"}
        />
      </CardHeader>
      <CardContent className="p-3 flex-grow">
        <CardTitle className="text-base font-semibold leading-tight truncate mb-1" title={item.tituloOriginal}>
          {item.tituloOriginal}
        </CardTitle>
        <div className="flex items-center text-xs text-muted-foreground mb-1">
          {mediaTypeIcon}
          <span className="ml-1">{mediaTypeLabel} {item.anoLancamento && `(${item.anoLancamento})`}</span>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Atualizado: {lastUpdated}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-2 border-t grid grid-cols-2 gap-2">
        <Button 
          onClick={() => onEdit(item)} 
          variant="outline"
          size="sm"
        >
          <Edit3 className="mr-1.5 h-3.5 w-3.5" />
          Editar
        </Button>
        <Button 
          onClick={() => onDelete(item.id)} 
          variant="destructive"
          size="sm"
          disabled={isDeleting}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {isDeleting ? 'Excluindo...' : 'Excluir'}
        </Button>
      </CardFooter>
    </Card>
  );
}
