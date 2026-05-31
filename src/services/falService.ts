// ─────────────────────────────────────────────────────────────
// FAL.AI SERVİSİ (src/services/falService.ts)
// ─────────────────────────────────────────────────────────────
// fal-ai/image-editing/hair-change modeli ile saç değiştirme
// Base64 formatında fotoğraf gönderir
// ai-hair.tsx adım 5'te çağrılır
// ─────────────────────────────────────────────────────────────

// FAL API key — .env'den EXPO_PUBLIC_FAL_KEY olarak alınır
const FAL_KEY = `Key ${process.env.EXPO_PUBLIC_FAL_KEY}`;

// URI → Base64 dönüşümü
// expo-image-picker'dan gelen URI'yi fal.ai'nın kabul ettiği base64 formatına çevirir
const uriToBase64DataUrl = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Input tipi — ai-hair.tsx'deki selectedStyle ve selectedColor buraya gelir
export interface HairChangeInput {
  photoUri: string;       // expo-image-picker URI
  modelPrompt: string;    // HAIR_STYLES.style alanı (örn: 'wavy bob')
  colorPrompt: string;    // HAIR_COLORS.apiColor alanı (örn: 'caramel')
  colorName: string;      // Gösterim için
  modelName: string;      // Gösterim için
}

export interface HairChangeResult {
  generatedImageUrl: string; // fal.ai sonuç görseli
}

// Ana fonksiyon — ai-hair.tsx adım 5'te çağrılır
// onProgress → işlem durumunu ekrana yansıtır
export const changeHairStyle = async (
  input: HairChangeInput,
  onProgress?: (status: string) => void,
): Promise<HairChangeResult> => {

  onProgress?.('Fotoğraf hazırlanıyor...');
  const base64Image = await uriToBase64DataUrl(input.photoUri);

  onProgress?.('AI saç modelini oluşturuyor...');

  const prompt = `Hair color: ${input.colorPrompt}. Hairstyle: ${input.modelPrompt}.`;

  const response = await fetch(
    'https://fal.run/fal-ai/image-editing/hair-change',
    {
      method: 'POST',
      headers: {
        Authorization: FAL_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: base64Image,
        prompt: prompt,
        negative_prompt: 'deformed, ugly, bad anatomy, bald, no hair, hair loss, face change, different person, morphed face, distorted face, face swap, altered facial features',
      }),
    }
  );

  const data = await response.json();
  console.log('FAL RESPONSE:', JSON.stringify(data));

  const generatedImageUrl =
    data?.image?.url ??
    data?.images?.[0]?.url ??
    null;

  if (!generatedImageUrl) {
    throw new Error('Görüntü oluşturulamadı. Tekrar deneyin.');
  }

  return { generatedImageUrl };
};