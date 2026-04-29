import React, { useState } from 'react';

const MEALS = [
  { day: 'Monday', total: 1450, meals: [
    { type: 'Breakfast', cal: 340, desc: 'Overnight oats: ½ cup oats, almond milk, 1 tbsp chia seeds, ½ banana, 5 almonds, honey drizzle', macros: 'P:12g · C:50g · F:10g' },
    { type: 'Lunch', cal: 420, desc: 'Rajma curry with ¾ cup brown rice + cucumber raita', macros: 'P:16g · C:60g · F:10g' },
    { type: 'Snack', cal: 150, desc: '1 apple + 1 tbsp peanut butter', macros: 'P:4g · C:22g · F:8g' },
    { type: 'Dinner', cal: 400, desc: 'Palak paneer (100g) with 2 small rotis + side salad', macros: 'P:20g · C:40g · F:16g' },
    { type: 'Evening', cal: 140, desc: 'Turmeric milk with honey + 3 cashews', macros: 'P:5g · C:16g · F:5g' },
  ]},
  { day: 'Tuesday', total: 1450, meals: [
    { type: 'Breakfast', cal: 330, desc: '2 moong dal chilla with mint chutney + chai (low sugar)', macros: 'P:14g · C:42g · F:10g' },
    { type: 'Lunch', cal: 430, desc: 'Chole with 2 small rotis + onion & lemon', macros: 'P:15g · C:58g · F:12g' },
    { type: 'Snack', cal: 160, desc: 'Greek yogurt (100g) + pomegranate seeds', macros: 'P:10g · C:14g · F:4g' },
    { type: 'Dinner', cal: 390, desc: 'Veggie stir-fry (broccoli, bell pepper, mushroom) with tofu + ½ cup quinoa', macros: 'P:18g · C:38g · F:14g' },
    { type: 'Evening', cal: 140, desc: '1 banana + 5 soaked almonds', macros: 'P:4g · C:22g · F:5g' },
  ]},
  { day: 'Wednesday', total: 1445, meals: [
    { type: 'Breakfast', cal: 350, desc: '2 besan omelettes with onion & tomato + 1 whole wheat toast', macros: 'P:12g · C:44g · F:12g' },
    { type: 'Lunch', cal: 410, desc: 'Dal tadka with ¾ cup brown rice + green salad', macros: 'P:16g · C:56g · F:8g' },
    { type: 'Snack', cal: 155, desc: '1 small mango + 2 walnuts', macros: 'P:3g · C:26g · F:5g' },
    { type: 'Dinner', cal: 390, desc: 'Paneer tikka (120g, grilled) with mint chutney, cucumber, 1 roti', macros: 'P:22g · C:30g · F:16g' },
    { type: 'Evening', cal: 140, desc: 'Herbal tea + 2 dates with peanut butter', macros: 'P:3g · C:22g · F:4g' },
  ]},
  { day: 'Thursday', total: 1450, meals: [
    { type: 'Breakfast', cal: 340, desc: 'Smoothie bowl: ½ banana, berries, yogurt, flax seeds, granola', macros: 'P:10g · C:48g · F:10g' },
    { type: 'Lunch', cal: 420, desc: 'Veg biryani (¾ cup rice, veggies, paneer) + raita', macros: 'P:14g · C:60g · F:12g' },
    { type: 'Snack', cal: 150, desc: 'Roasted makhana + green tea', macros: 'P:5g · C:20g · F:4g' },
    { type: 'Dinner', cal: 400, desc: 'Stuffed capsicum (paneer & peas) + 1 roti + tomato soup', macros: 'P:18g · C:42g · F:14g' },
    { type: 'Evening', cal: 140, desc: 'Warm low-fat milk + 1 tsp honey', macros: 'P:8g · C:16g · F:3g' },
  ]},
  { day: 'Friday', total: 1450, meals: [
    { type: 'Breakfast', cal: 350, desc: 'Poha with peas, peanuts, curry leaves, lemon + chai', macros: 'P:10g · C:50g · F:10g' },
    { type: 'Lunch', cal: 420, desc: 'Kadhi pakora with ¾ cup rice', macros: 'P:12g · C:58g · F:14g' },
    { type: 'Snack', cal: 150, desc: 'Sprout salad (moong, onion, tomato, chaat masala)', macros: 'P:8g · C:18g · F:2g' },
    { type: 'Dinner', cal: 390, desc: 'Mushroom & spinach curry with 2 multigrain rotis', macros: 'P:14g · C:44g · F:14g' },
    { type: 'Evening', cal: 140, desc: 'Roasted chana ¼ cup + herbal tea', macros: 'P:6g · C:18g · F:3g' },
  ]},
  { day: 'Saturday', total: 1450, meals: [
    { type: 'Breakfast', cal: 350, desc: '2 idli with sambar + coconut chutney', macros: 'P:10g · C:52g · F:6g' },
    { type: 'Lunch', cal: 430, desc: 'Aloo gobi sabzi + dal fry + 2 rotis', macros: 'P:14g · C:62g · F:10g' },
    { type: 'Snack', cal: 160, desc: 'Trail mix (almonds, cashews, raisins, pumpkin seeds)', macros: 'P:5g · C:16g · F:10g' },
    { type: 'Dinner', cal: 380, desc: 'Veg khichdi with pickle + buttermilk', macros: 'P:14g · C:50g · F:8g' },
    { type: 'Evening', cal: 130, desc: '1 small guava + salt & chili', macros: 'P:3g · C:18g · F:1g' },
  ]},
  { day: 'Sunday', total: 1450, meals: [
    { type: 'Breakfast', cal: 360, desc: 'Stuffed paratha (aloo/paneer) + yogurt + pickle', macros: 'P:10g · C:48g · F:14g' },
    { type: 'Lunch', cal: 420, desc: 'Rajma chawal + onion & lemon', macros: 'P:16g · C:58g · F:8g' },
    { type: 'Snack', cal: 150, desc: 'Fruit chaat (apple, banana, orange, chaat masala, lime)', macros: 'P:2g · C:34g · F:1g' },
    { type: 'Dinner', cal: 380, desc: 'Baingan bharta with 2 rotis + green chutney', macros: 'P:10g · C:46g · F:12g' },
    { type: 'Evening', cal: 140, desc: 'Turmeric-ginger tea + 2 digestive biscuits', macros: 'P:2g · C:22g · F:4g' },
  ]}
];

export default function MealsPage() {
  const [expanded, setExpanded] = useState(null);
  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  return (
    <div>
      <div className="card">
        <div className="card-title">🥗 Weekly Meal Plan</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>1,450 cal/day</strong> vegetarian plan. Rich in protein, fiber, and all the Indian comfort food you love. Tap a day to expand.
        </p>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Targets: ~1,450 cal · 55-65g protein · 25g+ fiber
        </div>
      </div>

      {MEALS.map((day, di) => {
        const isToday = day.day === todayName;
        const open = expanded === di || isToday;
        return (
          <div key={di} className="card" style={isToday ? { border: '1px solid var(--pink)' } : {}}>
            <div className="meal-day-header" onClick={() => setExpanded(open && !isToday ? null : di)}>
              <span>
                {isToday && '✨ '}{day.day}
                {isToday && <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--pink)' }}>(Today)</span>}
              </span>
              <span className="cal-total">{day.total} cal</span>
            </div>
            {open && day.meals.map((meal, mi) => (
              <div key={mi} className="meal-item">
                <div className="meal-item-header">
                  <span className="meal-type">{meal.type}</span>
                  <span className="meal-cals">{meal.cal} cal</span>
                </div>
                <div className="meal-desc">{meal.desc}</div>
                <div className="meal-macros">{meal.macros}</div>
              </div>
            ))}
            {!open && <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setExpanded(di)}>Tap to expand</div>}
          </div>
        );
      })}

      <div className="card">
        <div className="card-title">💡 Tips</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <p><strong>🥤</strong> 8-10 glasses of water daily. <strong>🍽</strong> Palm = 1 protein serving, fist = 1 carb serving.</p>
          <p style={{ marginTop: 4 }}><strong>⏰</strong> Eat every 3-4 hours. Don't skip breakfast! <strong>🔄</strong> Swap similar meals between days.</p>
          <p style={{ marginTop: 4 }}><strong>🎉</strong> Going over once a week is totally fine. Consistency over perfection 💕</p>
        </div>
      </div>
    </div>
  );
}
