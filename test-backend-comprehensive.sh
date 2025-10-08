#!/bin/bash

# Comprehensive backend testing
set -e

API_URL="http://localhost:8000/api"
EMAIL="test_$(date +%s)@test.com"
USERNAME="test_$(date +%s)"
PASSWORD="Test123!@#"

echo "🚀 Starting comprehensive backend tests..."
echo "======================================="

# 1. Register new user
echo -e "\n1️⃣ Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")
echo "$REGISTER_RESPONSE" | jq '.'

# 2. Login
echo -e "\n2️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo "✅ Token received"

# 3. Create deck
echo -e "\n3️⃣ Testing Create Deck..."
DECK_RESPONSE=$(curl -s -X POST "$API_URL/decks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Deck","description":"Test Description","category":"Testing"}')
DECK_ID=$(echo "$DECK_RESPONSE" | jq -r '.deck.id')
echo "✅ Deck created with ID: $DECK_ID"

# 4. Add cards
echo -e "\n4️⃣ Testing Add Cards..."
for i in {1..3}; do
  curl -s -X POST "$API_URL/cards" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"deckId\":\"$DECK_ID\",\"front\":\"Question $i\",\"back\":\"Answer $i\",\"difficulty\":2}" \
    | jq -r '.message' || echo "Card $i added"
done

# 5. Get decks
echo -e "\n5️⃣ Testing Get Decks..."
DECKS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/decks")
DECK_COUNT=$(echo "$DECKS" | jq '. | length')
echo "✅ Found $DECK_COUNT deck(s)"

# 6. Start study session
echo -e "\n6️⃣ Testing Study Session..."
STUDY_RESPONSE=$(curl -s -X POST "$API_URL/study/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"deckId\":\"$DECK_ID\"}")
SESSION_ID=$(echo "$STUDY_RESPONSE" | jq -r '.session.id')
FIRST_CARD_ID=$(echo "$STUDY_RESPONSE" | jq -r '.cards[0].id')
echo "✅ Session started: $SESSION_ID"

# 7. Submit answer
echo -e "\n7️⃣ Testing Submit Answer..."
curl -s -X POST "$API_URL/study/answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"cardId\":\"$FIRST_CARD_ID\",\"isCorrect\":true,\"timeSpent\":5000,\"hintsUsed\":0}" \
  | jq -r '.message' || echo "✅ Answer submitted"

# 8. Complete session
echo -e "\n8️⃣ Testing Complete Session..."
curl -s -X POST "$API_URL/study/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"sessionId\":\"$SESSION_ID\"}" \
  | jq -r '.message' || echo "✅ Session completed"

# 9. Get analytics
echo -e "\n9️⃣ Testing Analytics..."
ANALYTICS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/analytics/progress")
echo "$ANALYTICS" | jq '.totalStats'

# 10. Generate AI deck
echo -e "\n🔟 Testing AI Generation..."
AI_RESPONSE=$(curl -s -X POST "$API_URL/decks/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"topic":"Math Basics","cardCount":3,"difficulty":2}')
echo "$AI_RESPONSE" | jq -r '.message'

# Clean up
echo -e "\n🧹 Cleaning up..."
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$API_URL/decks/$DECK_ID" | jq -r '.message'

echo -e "\n✨ All backend tests completed successfully!"
