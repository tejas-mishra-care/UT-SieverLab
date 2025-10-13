'use server';

/**
 * @fileOverview An AI agent that recommends suitable materials based on sieve analysis results, using IS 383 standards.
 *
 * - recommendMaterials - A function that handles the material recommendation process.
 * - MaterialRecommendationsInput - The input type for the recommendMaterials function.
 * - MaterialRecommendationsOutput - The return type for the recommendMaterials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MaterialRecommendationsInputSchema = z.object({
  aggregateType: z.enum(['Fine', 'Coarse']).describe('The type of aggregate (Fine or Coarse).'),
  finenessModulus: z.number().describe('The fineness modulus of the aggregate.'),
  classification: z.string().describe('The zone classification of the fine aggregate as per IS 383 (e.g., Zone I, Zone II, Zone III, Zone IV), or grading for coarse aggregates.'),
  sieveSizes: z.array(z.number()).describe('List of sieve sizes used in the analysis in mm.'),
  percentPassing: z.array(z.number()).describe('List of % passing for each sieve size.'),
});
export type MaterialRecommendationsInput = z.infer<typeof MaterialRecommendationsInputSchema>;

const MaterialRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('Recommendations for suitable material usage based on the sieve analysis results and IS 383 standards.'),
});
export type MaterialRecommendationsOutput = z.infer<typeof MaterialRecommendationsOutputSchema>;

export async function recommendMaterials(input: MaterialRecommendationsInput): Promise<MaterialRecommendationsOutput> {
  return recommendMaterialsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'materialRecommendationsPrompt',
  input: {schema: MaterialRecommendationsInputSchema},
  output: {schema: MaterialRecommendationsOutputSchema},
  prompt: `You are a civil engineering expert specializing in aggregate material recommendations according to IS 383 standards.

  Based on the provided sieve analysis results, provide clear and concise recommendations for the suitable use of the aggregate material.

  Consider the aggregate type, fineness modulus, and zone classification (for fine aggregates) or grading (for coarse aggregates) to determine the appropriate applications.

  Aggregate Type: {{{aggregateType}}}
  Fineness Modulus: {{{finenessModulus}}}
  Classification/Grading: {{{classification}}}
  Sieve Sizes (mm): {{#each sieveSizes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Percent Passing: {{#each percentPassing}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Provide specific recommendations for the use of this aggregate, citing relevant clauses or tables from IS 383 where applicable to justify the recommendation.
  For example, if the aggregate is Zone II sand, recommend its use in concrete mixes as per IS 383 guidelines. Or, if it is a gap-graded coarse aggregate, recommend against its use in high-strength concrete.
  If information on the source of the material, or intended use, is missing, please indicate in the response that your response is limited without this information.`, 
});

const recommendMaterialsFlow = ai.defineFlow(
  {
    name: 'recommendMaterialsFlow',
    inputSchema: MaterialRecommendationsInputSchema,
    outputSchema: MaterialRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
