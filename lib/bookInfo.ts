interface BookInfo {
  readingLevel?: string;
  interestLevel?: string;
  coverUrl?: string;
}

export async function fetchBookInfo(
  title: string,
  author: string
): Promise<BookInfo> {
  try {
    const query = `${title} ${author}`.trim();
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
    );

    if (!response.ok) {
      console.error('Google Books API error:', response.status);
      return {};
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('No book found in Google Books API');
      return {};
    }

    const book = data.items[0].volumeInfo;
    const result: BookInfo = {};

    if (book.imageLinks?.thumbnail) {
      result.coverUrl = book.imageLinks.thumbnail.replace('http:', 'https:');
    }

    if (book.maturityRating) {
      result.interestLevel = book.maturityRating === 'NOT_MATURE'
        ? 'All Ages'
        : 'Mature';
    }

    if (book.categories && book.categories.length > 0) {
      const category = book.categories[0].toLowerCase();

      if (category.includes('juvenile') || category.includes('children')) {
        result.interestLevel = 'Ages 8-12';
      } else if (category.includes('young adult')) {
        result.interestLevel = 'Ages 12+';
      }
    }

    if (book.averageRating && book.pageCount) {
      const pages = book.pageCount;
      if (pages < 50) {
        result.readingLevel = 'Early Reader (K-2)';
      } else if (pages < 150) {
        result.readingLevel = 'Grade 3-5';
      } else if (pages < 300) {
        result.readingLevel = 'Grade 6-8';
      } else {
        result.readingLevel = 'Grade 9+';
      }
    }

    console.log('Book info fetched:', result);
    return result;
  } catch (error) {
    console.error('Error fetching book info:', error);
    return {};
  }
}
