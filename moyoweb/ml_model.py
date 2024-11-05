# myapp/ml_model.py
from joblib import load
import numpy as np

# Load SVM model
svm_model = load('moyoweb/model/logistic_regression_model.joblib')
