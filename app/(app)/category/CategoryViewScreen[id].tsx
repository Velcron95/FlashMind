import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { supabase } from "../../../lib/supabase/supabaseClient";
import type { Category } from "../../../types/database";
import type { Flashcard } from "../../../features/cards/types/cards";
import { CategorySections } from "../../../features/cards/components/CategorySections";
import { getCardContent } from "../../../features/cards/utils/cardHelpers";
import { useCardActions } from "../../../features/cards/hooks/useCardActions";

// Rest of your component code...
