#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:8000/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg4ZTUzZWNkLWVkM2ItNDU3Ny05ZTM4LTYxZjFlZmE3YmE1NyIsImVtYWlsIjoibmV3dXNlckB0ZXN0LmNvbSIsImlhdCI6MTc1OTg4Nzg4MywiZXhwIjoxNzYwNDkyNjgzfQ.1LPn1YyNNOxtqCVKE9D5MSPikfi4TLVPxaOEerea2LI"

echo -e "${YELLOW}Testing AI Study Buddy API Endpoints${NC}"
echo "======================================="

# Test 1: Health Check
echo -e "\n${YELLOW}1. Health Check${NC}"
curl -s "$API_BASE/../health" | jq '.' && echo -e "${GREEN}✓ Health check passed${NC}" || echo -e "${RED}✗ Health check failed${NC}"

# Test 2: Get User Info
echo -e "\n${YELLOW}2. Get User Info${NC}"
USER_INFO=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/auth/me")
echo "$USER_INFO" | jq '.'
if [ "$(echo "$USER_INFO" | jq -r '.user.id')" == "88e53ecd-ed3b-4577-9e38-61f1efa7ba57" ]; then
    echo -e "${GREEN}✓ User authentication working${NC}"
else
    echo -e "${RED}✗ User authentication failed${NC}"
fi

# Test 3: Get Decks
echo -e "\n${YELLOW}3. Get User Decks${NC}"
DECKS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/decks")
echo "$DECKS" | jq '.'
DECK_COUNT=$(echo "$DECKS" | jq '. | length')
echo -e "${GREEN}✓ Found $DECK_COUNT decks${NC}"

# Get first deck ID for testing
FIRST_DECK_ID=$(echo "$DECKS" | jq -r '.[0].id')

# Test 4: Get Deck Details
if [ "$FIRST_DECK_ID" != "null" ]; then
    echo -e "\n${YELLOW}4. Get Deck Details (ID: $FIRST_DECK_ID)${NC}"
    DECK_DETAIL=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/decks/$FIRST_DECK_ID")
    echo "$DECK_DETAIL" | jq '.'
    
    # Test 5: Get Deck Cards
    echo -e "\n${YELLOW}5. Get Cards for Deck${NC}"
    CARDS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/cards?deckId=$FIRST_DECK_ID")
    echo "$CARDS" | jq '.'
    CARD_COUNT=$(echo "$CARDS" | jq '. | length')
    echo -e "${GREEN}✓ Found $CARD_COUNT cards${NC}"
fi

# Test 6: Create New Deck
echo -e "\n${YELLOW}6. Create New Deck${NC}"
NEW_DECK=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test Deck","description":"API Test Deck","category":"test"}' \
    "$API_BASE/decks")
echo "$NEW_DECK" | jq '.'
NEW_DECK_ID=$(echo "$NEW_DECK" | jq -r '.id')

if [ "$NEW_DECK_ID" != "null" ]; then
    echo -e "${GREEN}✓ Deck created with ID: $NEW_DECK_ID${NC}"
    
    # Test 7: Add Cards to Deck
    echo -e "\n${YELLOW}7. Add Cards to New Deck${NC}"
    NEW_CARD=$(curl -s -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"deckId\":\"$NEW_DECK_ID\",\"front\":\"Test Question\",\"back\":\"Test Answer\",\"difficulty\":2}" \
        "$API_BASE/cards")
    echo "$NEW_CARD" | jq '.'
    
    # Test 8: Update Deck
    echo -e "\n${YELLOW}8. Update Deck${NC}"
    UPDATE_RESULT=$(curl -s -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"title":"Updated Test Deck","description":"Updated Description"}' \
        "$API_BASE/decks/$NEW_DECK_ID")
    echo "$UPDATE_RESULT" | jq '.'
    
    # Test 9: Delete Deck
    echo -e "\n${YELLOW}9. Delete Test Deck${NC}"
    DELETE_RESULT=$(curl -s -X DELETE \
        -H "Authorization: Bearer $TOKEN" \
        "$API_BASE/decks/$NEW_DECK_ID")
    echo "$DELETE_RESULT" | jq '.'
fi

# Test 10: Analytics
echo -e "\n${YELLOW}10. Get Analytics${NC}"
ANALYTICS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/analytics/progress")
echo "$ANALYTICS" | jq '.'

# Test 11: Generate AI Deck
echo -e "\n${YELLOW}11. Generate AI Deck${NC}"
AI_DECK=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"topic":"JavaScript Testing","cardCount":3,"difficulty":2}' \
    "$API_BASE/ai/generate-deck")
echo "$AI_DECK" | jq '.'

if [ "$(echo "$AI_DECK" | jq -r '.deck.id')" != "null" ]; then
    echo -e "${GREEN}✓ AI Deck generated successfully${NC}"
    AI_DECK_ID=$(echo "$AI_DECK" | jq -r '.deck.id')
    
    # Clean up AI deck
    echo -e "\n${YELLOW}Cleaning up AI deck${NC}"
    curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$API_BASE/decks/$AI_DECK_ID" > /dev/null
    echo -e "${GREEN}✓ AI deck cleaned up${NC}"
fi

echo -e "\n${YELLOW}=======================================${NC}"
echo -e "${GREEN}API Testing Complete!${NC}"
