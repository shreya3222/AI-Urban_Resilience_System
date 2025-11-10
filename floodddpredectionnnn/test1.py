# 📦 Import Libraries
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from xgboost import XGBClassifier
import joblib

# ✅ Load Dataset
df = pd.read_csv("flood.csv")

# 🧹 Prepare Features & Labels
X = df.drop(columns=["flood", "Latitude", "Longitude"])
y = df["flood"]

# ⚖️ Standardize Features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 🔀 Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# ⚡ Train XGBoost Model
model = XGBClassifier(use_label_encoder=False, eval_metric='logloss')
model.fit(X_train, y_train)

# 📈 Evaluate Model
y_pred = model.predict(X_test)

print("✅ Accuracy:", accuracy_score(y_test, y_pred))
print("\n📊 Classification Report:\n", classification_report(y_test, y_pred))
print("\n🔲 Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

# 💾 Save Model and Scaler for Deployment
joblib.dump(model, 'flood_model.pkl')
joblib.dump(scaler, 'scaler.pkl')
