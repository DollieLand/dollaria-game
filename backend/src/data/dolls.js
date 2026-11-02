// Каталог кукол и еженедельных коллекций.
// ВАЖНО: имена, описания и картинки здесь — временные. Замените их на свои,
// а картинки положите в frontend/public/assets/dolls/<id>.png (имя файла = id куклы).
//
// Категории прозрачны для игрока: у каждой куклы показываются очки и точный шанс выпадения.
// weight — относительный вес выпадения внутри своей коллекции (шанс = weight / сумма весов).

export const CATEGORIES = {
  common: { title: 'Обычная', points: 10, duplicateRibbons: 5 },
  rare: { title: 'Редкая', points: 20, duplicateRibbons: 10 },
  special: { title: 'Особая', points: 35, duplicateRibbons: 20 },
  legendary: { title: 'Легендарная', points: 60, duplicateRibbons: 40 },
};

// Коллекции недели. Даты — по часовому поясу игры (GAME_TIMEZONE), включительно.
export const COLLECTIONS = [
  { id: 'pink-christmas', title: 'Pink Christmas', startsOn: '2026-11-01', endsOn: '2026-12-07', setBonus: 50, inGacha: true, sort: 1 },
  { id: 'candy-girls', title: 'Candy Girls', startsOn: '2026-12-08', endsOn: '2026-12-14', setBonus: 50, inGacha: true, sort: 2 },
  { id: 'winter-princesses', title: 'Winter Princesses', startsOn: '2026-12-15', endsOn: '2026-12-21', setBonus: 50, inGacha: true, sort: 3 },
  { id: 'christmas-party', title: 'Christmas Party', startsOn: '2026-12-22', endsOn: '2026-12-28', setBonus: 50, inGacha: true, sort: 4 },
  { id: 'new-year-queens', title: 'New Year Queens', startsOn: '2026-12-29', endsOn: '2026-12-31', setBonus: 50, inGacha: true, sort: 5 },
  { id: 'exclusive', title: 'Exclusive', startsOn: null, endsOn: null, setBonus: 0, inGacha: false, sort: 6 },
];

const W = { common: 30, rare: 20, special: 15, legendary: 5 };
function set(collection, list) {
  return list.map(([id, name, category, description], i) => ({
    id,
    name,
    category,
    description,
    collectionId: collection,
    weight: W[category],
    sort: i,
  }));
}

export const DOLLS = [
  ...set('pink-christmas', [
    ['pc-pearl', 'Перл', 'legendary', '[Описание куклы — замените на своё]'],
    ['pc-holly', 'Холли', 'special', '[Описание куклы — замените на своё]'],
    ['pc-cherry', 'Вишенка', 'rare', '[Описание куклы — замените на своё]'],
    ['pc-marshmallow', 'Зефирка', 'common', '[Описание куклы — замените на своё]'],
    ['pc-snow', 'Снежана', 'common', '[Описание куклы — замените на своё]'],
  ]),
  ...set('candy-girls', [
    ['cg-caramel', 'Карамель', 'legendary', '[Описание куклы — замените на своё]'],
    ['cg-toffee', 'Ириска', 'special', '[Описание куклы — замените на своё]'],
    ['cg-jelly', 'Мармелад', 'rare', '[Описание куклы — замените на своё]'],
    ['cg-praline', 'Пралине', 'common', '[Описание куклы — замените на своё]'],
    ['cg-sugar', 'Сахарок', 'common', '[Описание куклы — замените на своё]'],
  ]),
  ...set('winter-princesses', [
    ['wp-aurora', 'Аврора', 'legendary', '[Описание куклы — замените на своё]'],
    ['wp-frost', 'Иней', 'special', '[Описание куклы — замените на своё]'],
    ['wp-crystal', 'Кристалл', 'rare', '[Описание куклы — замените на своё]'],
    ['wp-blizzard', 'Вьюжка', 'common', '[Описание куклы — замените на своё]'],
    ['wp-flake', 'Снежинка', 'common', '[Описание куклы — замените на своё]'],
  ]),
  ...set('christmas-party', [
    ['cp-velvet', 'Вельвет', 'legendary', '[Описание куклы — замените на своё]'],
    ['cp-sparkle', 'Искорка', 'special', '[Описание куклы — замените на своё]'],
    ['cp-cocoa', 'Какао', 'rare', '[Описание куклы — замените на своё]'],
    ['cp-ginger', 'Имбирька', 'common', '[Описание куклы — замените на своё]'],
    ['cp-tinsel', 'Мишура', 'common', '[Описание куклы — замените на своё]'],
  ]),
  ...set('new-year-queens', [
    ['nq-midnight', 'Полночь', 'legendary', '[Описание куклы — замените на своё]'],
    ['nq-champagne', 'Шампань', 'special', '[Описание куклы — замените на своё]'],
    ['nq-garland', 'Гирлянда', 'rare', '[Описание куклы — замените на своё]'],
    ['nq-firework', 'Салюта', 'common', '[Описание куклы — замените на своё]'],
    ['nq-star', 'Звёздочка', 'common', '[Описание куклы — замените на своё]'],
  ]),
  // Кукла, которую можно получить только в календаре 31 декабря.
  { id: 'ex-new-year', name: 'Новогодняя Ночь', category: 'legendary', description: '[Описание куклы — замените на своё]', collectionId: 'exclusive', weight: 0, sort: 0 },
];
