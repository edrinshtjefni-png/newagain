import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Find the SalonDetail rendering in App.tsx
pattern = r'(<SalonDetail\s*salon=\{activeSalon\}\s*isFavorite=\{[^\}]+\}\s*onToggleFavorite=\{handleToggleFavorite\}\s*onBack=\{[^\}]+\}\s*onBookService=\{handleBookService\}\s*)/>'
replacement = r'\1 user={user} onAuthPrompt={() => setIsAuthModalOpen(true)} />'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(new_content)
