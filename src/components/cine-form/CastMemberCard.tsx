// src/components/cine-form/CastMemberCard.tsx
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CastMember } from '@/ai/flows/tmdb-cast-search-flow';

interface CastMemberCardProps {
  member: CastMember;
}

export function CastMemberCard({ member }: CastMemberCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0 relative h-72 w-full">
        <Image
          src={member.profileImageUrl}
          alt={`Foto de ${member.name}`}
          layout="fill"
          objectFit="cover"
          className="rounded-t-md"
          data-ai-hint="person portrait"
        />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold truncate" title={member.name}>
          {member.name}
        </CardTitle>
        {member.knownForDepartment && (
          <p className="text-sm text-muted-foreground">{member.knownForDepartment}</p>
        )}
      </CardContent>
    </Card>
  );
}
