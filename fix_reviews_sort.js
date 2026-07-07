import fs from 'fs';

let code = fs.readFileSync('src/components/SalonDetail.tsx', 'utf8');

// 1. Add reviewSort state
code = code.replace(
  "const [reviewError, setReviewError] = useState<string | null>(null);",
  "const [reviewError, setReviewError] = useState<string | null>(null);\n  const [reviewSort, setReviewSort] = useState<'Newest' | 'Oldest' | 'Highest Rating'>('Newest');"
);

// 2. Add sortedReviews logic before return
const beforeReturn = `  const filteredServices = salon.services.filter(s => {
    const matchCategory = activeCategory === 'All' || s.category === activeCategory;
    const matchPrice = priceFilter === 'All' || getPriceCategory(s.price) === priceFilter;
    return matchCategory && matchPrice;
  });`;

const newBeforeReturn = `  const filteredServices = salon.services.filter(s => {
    const matchCategory = activeCategory === 'All' || s.category === activeCategory;
    const matchPrice = priceFilter === 'All' || getPriceCategory(s.price) === priceFilter;
    return matchCategory && matchPrice;
  });

  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'Newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (reviewSort === 'Oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (reviewSort === 'Highest Rating') {
      return b.rating - a.rating;
    }
    return 0;
  });`;

code = code.replace(beforeReturn, newBeforeReturn);

// 3. Render sort dropdown and use sortedReviews
const oldReviewsList = `        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-white border border-brand-border rounded-3xl">
            <Star className="w-8 h-8 text-brand-border mx-auto mb-3" />
            <p className="text-brand-muted text-sm font-semibold">No reviews yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(review => (`;

const newReviewsList = `        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-white border border-brand-border rounded-3xl">
            <Star className="w-8 h-8 text-brand-border mx-auto mb-3" />
            <p className="text-brand-muted text-sm font-semibold">No reviews yet.</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <div className="relative">
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as any)}
                  className="appearance-none bg-white border border-brand-border text-brand-text text-xs font-bold py-2 pl-4 pr-8 rounded-xl shadow-xs outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary cursor-pointer"
                >
                  <option value="Newest">Newest</option>
                  <option value="Oldest">Oldest</option>
                  <option value="Highest Rating">Highest Rating</option>
                </select>
                <ChevronDown className="w-4 h-4 text-brand-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedReviews.map(review => (`;

code = code.replace(oldReviewsList, newReviewsList);

// close the new div wrapper for the list
const oldGridEnd = `              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}`;

const newGridEnd = `              </div>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`;

code = code.replace(oldGridEnd, newGridEnd);

fs.writeFileSync('src/components/SalonDetail.tsx', code);
