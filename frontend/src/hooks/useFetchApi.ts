// Freestyle Task #2
import { useEffect, useState } from 'react';
import Bottleneck from 'bottleneck';

export const useFetchApi = () => {
  const [inputValueName, setInputValueName] = useState<string | null>(null);
  const [inputValueScore, setInputValueScore] = useState<string | null>(null);
  const [apiData, setApiData] = useState<any[]>([]);
  const [trigger, setTrigger] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * The API providers "Open Food Facts" enforce a rate limit, and therefore this safety measure(Bottleneck) has been implemented.
   * 10 req/min for all search queries are allowed.
   */
  const limiter = new Bottleneck({
    minTime: 6000, // 10 requests per minute = 1 request every 6 seconds
  });

  const limitedFetchApi = limiter.wrap(async (name: string, score: string) => {
    setLoading(true);
    const response = await fetch(
      `https://world.openfoodfacts.net/api/v2/search?categories_tags_en=${name}&nutrition_grades_tags=${score}&fields=nutrition_grades,categories_tags_en,product_name`,
    );
    const data = await response.json();
    setLoading(false);
    console.log(data);
    return data;
  });

  const limitedFetch = limiter.wrap(limitedFetchApi);

  useEffect(() => {
    console.log('Component did mount');
    if (trigger && inputValueName !== null && inputValueScore !== null) {
      limitedFetch(inputValueName, inputValueScore).then((data) => {
        setApiData(data.products || []);
        setTrigger(false);
      });
    }
  }, [trigger, inputValueName, inputValueScore]);

  return {
    inputValueName,
    setInputValueName,
    inputValueScore,
    setInputValueScore,
    apiData,
    setApiData,
    setTrigger,
    loading,
    setLoading,
  };
};
