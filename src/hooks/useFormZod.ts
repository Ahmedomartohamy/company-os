import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ZodSchema, TypeOf } from 'zod';

export function useFormZod<TSchema extends ZodSchema<any>>(
  schema: TSchema,
  defaults?: Partial<TypeOf<TSchema>>,
) {
  return useForm<TypeOf<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues: defaults as any,
    mode: 'onChange',
  });
}
