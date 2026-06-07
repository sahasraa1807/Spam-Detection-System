import joblib
import numpy as np
import shap
from lime.lime_text import LimeTextExplainer

class XAIService:
    def __init__(self, model_path='backend/linear_svm_model.pkl', vectorizer_path='backend/tfidf_vectorizer.pkl'):
        self.model = joblib.load(model_path)
        self.vectorizer = joblib.load(vectorizer_path)
        self.explainer = LimeTextExplainer(class_names=['Ham', 'Spam'])
        
        # Background samples for SHAP
        self.background_texts = ["free lottery", "hello friend", "urgent meeting", "win cash"]
        self.background_features = self.vectorizer.transform(self.background_texts)

    def _predict_proba_wrapper(self, texts):
        features = self.vectorizer.transform(texts)
        decision = self.model.decision_function(features)
        if decision.ndim > 1:
            decision = decision[:, 1]
        probs = 1 / (1 + np.exp(-decision))
        n_samples = len(texts)
        prob_matrix = np.zeros((n_samples, 2))
        prob_matrix[:, 1] = probs
        prob_matrix[:, 0] = 1 - probs
        return prob_matrix

    def get_local_explanation(self, text):
        exp = self.explainer.explain_instance(text, self._predict_proba_wrapper, num_features=5)
        return [[str(word), float(score)] for word, score in exp.as_list()]

    def get_global_importance(self):
        """Generates global feature importance using SHAP for LinearSVC."""
        # 1. Convert to dense array
        dense_background = self.background_features.toarray()
        
        # 2. Initialize and calculate
        explainer = shap.LinearExplainer(self.model, dense_background)
        shap_values = explainer.shap_values(dense_background)
        
        # 3. FIX: Handle the multi-class dimension
        # If shap_values is a list (for multi-output), take the second class (index 1)
        # If it is a 3D array (samples, features, classes), take the second class
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        elif shap_values.ndim == 3:
            shap_values = shap_values[:, :, 1]

        # 4. Calculate mean absolute importance
        feature_names = self.vectorizer.get_feature_names_out()
        importance = np.abs(shap_values).mean(axis=0)
        
        # 5. Pair and sort
        feature_importance = dict(zip(feature_names, importance))
        sorted_importance = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return [[word, float(score)] for word, score in sorted_importance]