import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CROP_MAP = {
  'Banana': 'banana',
  'Rice': 'rice',
  'Coffee': 'coffee',
  'Coconut': 'coconut',
  'Black Pepper': 'black_pepper',
  'Cardamom': 'cardamom',
  'Ginger': 'ginger',
  'Cashewnuts': 'cashew'
};

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const API_KEY = Deno.env.get('DATA_GOV_API_KEY');
    if (!API_KEY) throw new Error("Missing API Key");

    const res = await fetch(
      `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=2000`
    );
    const json = await res.json();
    const records = json.records;

    console.log(`Fetched ${records.length} records`);

    for (const [apiName, dbId] of Object.entries(CROP_MAP)) {
      const marketData = records.find((r: any) => r.commodity.includes(apiName));

      if (marketData) {
        const newPrice = parseFloat(marketData.modal_price);

        // Get current DB data
        const { data: old } = await supabase
          .from('market_prices')
          .select('price, prev_price, last_updated')
          .eq('crop_id', dbId)
          .single();

        let finalPrevPrice = newPrice; // Default for new items
        let trend = 'stable';
        let change = 0;

        if (old) {
            const today = new Date().toDateString();
            const lastUpdateDate = new Date(old.last_updated).toDateString();

            if (today === lastUpdateDate) {
                // 1. SAME DAY UPDATE: Keep the existing anchor
                // If robot runs twice today, we don't want to lose "yesterday's" price.
                finalPrevPrice = old.prev_price;
            } else {
                // 2. NEW DAY: Yesterday's price becomes the anchor
                finalPrevPrice = old.price;
            }

            // Calculate trend based on the stable anchor
            change = newPrice - finalPrevPrice;
            if (change > 0) trend = 'up';
            if (change < 0) trend = 'down';
        }

        // Update DB
        const { error } = await supabase.from('market_prices').upsert({
          crop_id: dbId,
          name: marketData.commodity,
          price: newPrice,
          prev_price: finalPrevPrice, // Use our smart anchor
          trend: trend,
          change: Math.abs(change),
          unit: 'Quintal',
          last_updated: new Date().toISOString()
        }, { onConflict: 'crop_id' });
        
        if (error) console.error(`❌ Error ${dbId}:`, error);
        else console.log(`✅ Updated ${dbId}: ${newPrice}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
})