import React, { useState } from 'react';

const MEAL_PLAN = [
  {
    day: 'Monday',
    total: 1450,
    meals: [
      { type: 'Breakfast', cal: 340, desc: 'Overnight oats with ½ cup oats, ½ cup almond milk, 1 tbsp chia seeds, ½ banana sliced, 5 almonds, drizzle of honey', macros: 'P: 12g · C: 50g · F: 10g · Fiber: 8g' },
      { type: 'Lunch', cal: 420, desc: 'Rajma (kidney bean) curry with ¾ cup brown rice, side of cucumber raita (2 tbsp yogurt + cucumber)', macros: 'P: 16g · C: 60g · F: 10g · Fiber: 10g' },
      { type: 'Snack', cal: 150, desc: '1 medium apple + 1 tbsp peanut butter', macros: 'P: 4g · C: 22g · F: 8g · Fiber: 4g' },
      { type: 'Dinner', cal: 400, desc: 'Palak paneer (100g paneer) with 2 small rotis, side salad with lemon dressing', macros: 'P: 20g · C: 40g · F: 16g · Fiber: 5g' },
      { type: 'Evening', cal: 140, desc: '1 cup warm turmeric milk with ½ tsp honey + 3 cashews', macros: 'P: 5g · C: 16g · F: 5g' },
    ]
  },
  {
    day: 'Tuesday',
    total: 1450,
    meals: [
      { type: 'Breakfast', cal: 330, desc: '2 moong dal chilla (savory lentil crepes) with mint chutney + ½ cup chai (low sugar)', macros: 'P: 14g · C: 42g · F: 10g · Fiber: 6g' },
      { type: 'Lunch', cal: 430, desc: 'Chole (chickpea curry) with 2 small rotis + sliced onion & lemon', macros: 'P: 15g · C: 58g · F: 12g · Fiber: 11g' },
      { type: 'Snack', cal: 160, desc: 'Greek yogurt (100g) with a handful of pomegranate seeds', macros: 'P: 10g · C: 14g · F: 4g · Fiber: 2g' },
      { type: 'Dinner', cal: 390, desc: 'Mixed vegetable stir-fry (broccoli, bell pepper, mushroom) with tofu (100g) + ½ cup quinoa', macros: 'P: 18g · C: 38g · F: 14g · Fiber: 7g' },
      { type: 'Evening', cal: 140, desc: '1 banana + 5 soaked almonds', macros: 'P: 4g · C: 22g · F: 5g' },
    ]
  },
  {
    day: 'Wednesday',
    total: 1445,
    meals: [
      { type: 'Breakfast', cal: 350, desc: '2 egg-style besan (gram flour) omelette with onion & tomato + 1 slice whole wheat toast', macros: 'P: 12g · C: 44g · F: 12g · Fiber: 5g' },
      { type: 'Lunch', cal: 410, desc: 'Dal tadka (yellow lentils) with ¾ cup brown rice + mixed green salad', macros: 'P: 16g · C: 56g · F: 8g · Fiber: 9g' },
      { type: 'Snack', cal: 155, desc: '1 small mango + 2 walnuts', macros: 'P: 3g · C: 26g · F: 5g · Fiber: 3g' },
      { type: 'Dinner', cal: 390, desc: 'Paneer tikka (120g paneer, grilled) with mint chutney, cucumber & onion rings, 1 roti', macros: 'P: 22g · C: 30g · F: 16g · Fiber: 4g' },
      { type: 'Evening', cal: 140, desc: 'Herbal tea + 2 dates stuffed with peanut butter', macros: 'P: 3g · C: 22g · F: 4g' },
    ]
  },
  {
    day: 'Thursday',
    total: 1450,
    meals: [
      { type: 'Breakfast', cal: 340, desc: 'Smoothie bowl: ½ banana, ½ cup frozen berries, ½ cup yogurt, 1 tbsp flax seeds, topped with granola', macros: 'P: 10g · C: 48g · F: 10g · Fiber: 7g' },
      { type: 'Lunch', cal: 420, desc: 'Vegetable biryani (¾ cup basmati rice, mixed veggies, paneer cubes) + raita', macros: 'P: 14g · C: 60g · F: 12g · Fiber: 6g' },
      { type: 'Snack', cal: 150, desc: 'Makhana (fox nuts) roasted with a pinch of salt + green tea', macros: 'P: 5g · C: 20g · F: 4g · Fiber: 3g' },
      { type: 'Dinner', cal: 400, desc: 'Stuffed capsicum with cottage cheese & peas filling + 1 roti + tomato soup', macros: 'P: 18g · C: 42g · F: 14g · Fiber: 6g' },
      { type: 'Evening', cal: 140, desc: '1 cup warm milk (low-fat) + 1 tsp honey', macros: 'P: 8g · C: 16g · F: 3g' },
    ]
  },
  {
    day: 'Friday',
    total: 1450,
    meals: [
      { type: 'Breakfast', cal: 350, desc: 'Poha (flattened rice) with peas, peanuts, curry leaves, lemon + 1 cup chai', macros: 'P: 10g · C: 50g · F: 10g · Fiber: 4g' },
      { type: 'Lunch', cal: 420, desc: 'Kadhi pakora (gram flour dumplings in yogurt curry) with ¾ cup steamed rice', macros: 'P: 12g · C: 58g · F: 14g · Fiber: 5g' },
      { type: 'Snack', cal: 150, desc: 'Sprout salad (moong sprouts, onion, tomato, lemon, chaat masala)', macros: 'P: 8g · C: 18g · F: 2g · Fiber: 6g' },
      { type: 'Dinner', cal: 390, desc: 'Mushroom & spinach curry with 2 small multigrain rotis', macros: 'P: 14g · C: 44g · F: 14g · Fiber: 8g' },
      { type: 'Evening', cal: 140, desc: 'Roasted chana (chickpeas) ¼ cup + herbal tea', macros: 'P: 6g · C: 18g · F: 3g · Fiber: 4g' },
    ]
  },
  {
    day: 'Saturday',
    total: 1450,
    meals: [
      { type: 'Breakfast', cal: 350, desc: '2 idli with sambar + coconut chutney (1 tbsp)', macros: 'P: 10g · C: 52g · F: 6g · Fiber: 5g' },
      { type: 'Lunch', cal: 430, desc: 'Aloo gobi (potato-cauliflower) dry sabzi with dal fry + 2 rotis', macros: 'P: 14g · C: 62g · F: 10g · Fiber: 8g' },
      { type: 'Snack', cal: 160, desc: 'Handful of trail mix (almonds, cashews, raisins, pumpkin seeds)', macros: 'P: 5g · C: 16g · F: 10g · Fiber: 2g' },
      { type: 'Dinner', cal: 380, desc: 'Vegetable khichdi (rice + moong dal + veggies) with pickle + buttermilk', macros: 'P: 14g · C: 50g · F: 8g · Fiber: 6g' },
      { type: 'Evening', cal: 130, desc: '1 small guava + pinch of salt & chili powder', macros: 'P: 3g · C: 18g · F: 1g · Fiber: 5g' },
    ]
  },
  {
    day: 'Sunday',
    total: 1450,
    meals: [
      { type: 'Breakfast', cal: 360, desc: 'Stuffed paratha (aloo or paneer) with a dollop of yogurt + pickle', macros: 'P: 10g · C: 48g · F: 14g · Fiber: 4g' },
      { type: 'Lunch', cal: 420, desc: 'Rajma chawal (kidney bean curry with rice) + sliced onion, lemon', macros: 'P: 16g · C: 58g · F: 8g · Fiber: 10g' },
      { type: 'Snack', cal: 150, desc: 'Fruit chaat (apple, banana, orange with chaat masala & lime)', macros: 'P: 2g · C: 34g · F: 1g · Fiber: 5g' },
      { type: 'Dinner', cal: 380, desc: 'Baingan bharta (roasted eggplant mash) with 2 rotis + green chutney', macros: 'P: 10g · C: 46g · F: 12g · Fiber: 8g' },
      { type: 'Evening', cal: 140, desc: 'Warm turmeric-ginger tea + 2 biscuits (digestive)', macros: 'P: 2g · C: 22g · F: 4g' },
    ]
  }
];

export default function MealsPage() {
  const [expandedDay, setExpandedDay] = useState(null);

  const todayIdx = new Date().getDay();
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayOrder[todayIdx];

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">🥗 Dhruvi's Weekly Meal Plan</div>
        <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5, marginBottom: 8 }}>
          A balanced <strong>1,450 calorie</strong> vegetarian plan designed for your fitness goals. 
          Rich in protein, fiber, and all the Indian comfort food you love! Tap a day to see details.
        </p>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong>Daily targets:</strong> ~1,450 cal · 55-65g protein · 25g+ fiber
        </div>
      </div>

      {MEAL_PLAN.map((day, di) => {
        const isToday = day.day === todayName;
        const isExpanded = expandedDay === di;

        return (
          <div key={di} className="card meal-day" style={isToday ? { borderColor: 'var(--pink)', borderWidth: 2 } : {}}>
            <div className="meal-day-header" onClick={() => setExpandedDay(isExpanded ? null : di)} style={{ cursor: 'pointer' }}>
              <span>
                {isToday && '✨ '}{day.day}
                {isToday && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--pink)' }}>(Today!)</span>}
              </span>
              <span className="cal-total">{day.total} cal</span>
            </div>

            {(isExpanded || isToday) && day.meals.map((meal, mi) => (
              <div key={mi} className="meal-item">
                <div className="meal-item-header">
                  <span className="meal-type">{meal.type}</span>
                  <span className="meal-cals">{meal.cal} cal</span>
                </div>
                <div className="meal-desc">{meal.desc}</div>
                <div className="meal-macros">{meal.macros}</div>
              </div>
            ))}

            {!isExpanded && !isToday && (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setExpandedDay(di)}>
                Tap to expand
              </div>
            )}
          </div>
        );
      })}

      <div className="card">
        <div className="card-title">💡 Meal Tips for Dhruvi</div>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
          <p><strong>🥤 Water:</strong> Drink 8-10 glasses daily. Keep a water bottle with you at all times!</p>
          <p style={{ marginTop: 8 }}><strong>🍽 Portions:</strong> Use your palm as a guide — 1 palm = 1 serving of protein, 1 fist = 1 serving of carbs.</p>
          <p style={{ marginTop: 8 }}><strong>⏰ Timing:</strong> Try to eat every 3-4 hours. Don't skip breakfast — it fuels your morning!</p>
          <p style={{ marginTop: 8 }}><strong>🧘 Mindful eating:</strong> Eat slowly, chew well, and enjoy your food. Avoid eating while scrolling!</p>
          <p style={{ marginTop: 8 }}><strong>🔄 Swaps:</strong> Feel free to swap similar meals between days. The key is hitting ~1,450 calories with good protein.</p>
          <p style={{ marginTop: 8 }}><strong>🎉 Treat yourself:</strong> It's okay to go over once a week! One meal won't undo your progress. Consistency over perfection 💕</p>
        </div>
      </div>
    </div>
  );
}
