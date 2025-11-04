import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PageInfo } from './page-info.type';

export function Paginated<T>(classRef: Type<T>): Type<any> {
  @ObjectType(`${classRef.name}Edge`)
  class EdgeType {
    @Field()
    cursor: string;

    @Field(() => classRef)
    node: T;
  }

  @ObjectType({ isAbstract: true })
  class PaginatedType {
    @Field(() => [EdgeType])
    edges: EdgeType[];

    @Field()
    pageInfo: PageInfo;

    @Field(() => Int)
    count: number;
  }

  return PaginatedType;
}
