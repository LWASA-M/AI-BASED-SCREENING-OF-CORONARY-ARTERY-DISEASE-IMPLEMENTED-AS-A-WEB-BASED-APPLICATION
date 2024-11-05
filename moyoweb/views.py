import os
from django.shortcuts import render
from django.http import JsonResponse
from joblib import load
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import shap

# Use 'Agg' backend for Matplotlib to avoid main thread issues
plt.switch_backend('Agg')

def index(request):
    return render(request, 'moyoweb/index.html')

def show_inner_page(request):
    return render(request, 'moyoweb/inner-page.html')

def view_results(request):
    neuralnetwork_model = load('moyoweb/model/neuralnetwork.joblib')
    scaler = load('moyoweb/model/scaler.joblib')
    X_train = pd.read_csv('moyoweb/model/CAD.csv')

    # Encode categorical features in X_train
    X_train['Sex'] = X_train['Sex'].apply(lambda x: 1 if x.lower() == 'Male' else 0)
    X_train['Obesity'] = X_train['Obesity'].apply(lambda x: 1 if x.lower() == 'Y' else 0)

    if request.method == 'POST':
        try:
            # Retrieve and process form data
            age = int(request.POST.get('age'))
            weight = int(request.POST.get('weight'))
            height = int(request.POST.get('height'))
            sex = 1 if request.POST.get('sex').lower() == 'male' else 0
            diab = 1 if request.POST.get('diabetic').lower() == 'diabetic' else 0
            bp1 = int(request.POST.get('sbp'))
            bp2 = int(request.POST.get('dbp'))
            csm = 1 if request.POST.get('csm').lower() == 'smoker' else 0

            # Calculate BMI
            bmi = weight / (height / 100) ** 2

            # Determine hypertension and obesity
            htn = 1 if bp1 >= 140 or bp2 >= 90 else 0
            obesity = 1 if bmi >= 30 else 0

            # Prepare input data
            feature_names = ['Age', 'Sex', 'DiabetesMellitus', 'Hypertension', 'Current Smoker', 'Obesity']
            input_data = pd.DataFrame([[age, sex, diab, htn, csm, obesity]], columns=feature_names)

            # Apply scaling to Age feature
            input_data['Age'] = scaler.transform(input_data[['Age']])

            print(f"Input data: {input_data}")

            # Make predictions and generate plots
            nn_prediction, feature_importance_plot_path, risk_factors = neuralnetwork(neuralnetwork_model, input_data, X_train, feature_names)
            print(f"Prediction: {nn_prediction}")
            print(f"Feature importance plot path: {feature_importance_plot_path}")

            prediction_text = "The patient is at risk of having coronary artery disease" if nn_prediction == 1 else "The patient is having a low risk of developing coronary artery disease"

            # Generate lifestyle recommendations based on risk factors
            recommendations = generate_recommendations(risk_factors)

            # Return JSON response
            return JsonResponse({
                'result': prediction_text,
                'feature_importance_plot_path': feature_importance_plot_path,
                'recommendations': recommendations
            })

        except Exception as e:
            print(f"Exception: {e}")
            return JsonResponse({'error': f"Error processing form data: {e}"}, status=400)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

def save_feature_importance_plot(model, X_train, output_path):
    try:
        # Initialize the SHAP explainer
        explainer = shap.KernelExplainer(model.predict, X_train.sample(100))
        shap_values = explainer.shap_values(X_train)

        # Plot the SHAP summary plot
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X_train, show=False)
        shap_plot_filename = 'shap_summary_plot.png'
        plot_path = os.path.join(output_path, shap_plot_filename)
        plt.savefig(plot_path, bbox_inches='tight')
        plt.close()
        print(f"SHAP summary plot saved at: {plot_path}")

        return shap_plot_filename

    except Exception as e:
        print(f"Error generating or saving SHAP plot: {e}")
        return None

def neuralnetwork(model, input_data, X_train, feature_names):
    # Check and convert input_data if necessary
    if isinstance(input_data, pd.DataFrame):
        input_data = input_data.to_numpy()  # Convert DataFrame to numpy array
    elif not isinstance(input_data, np.ndarray):
        raise TypeError("input_data must be a pandas DataFrame or a numpy array")

    print("Input Data Shape:", input_data.shape)
    print("Input Data Type:", type(input_data))

    status = model.predict(input_data)

    # Paths to save the plots
    output_dir = os.path.join(os.path.dirname(__file__), 'static', 'assets', 'img')
    os.makedirs(output_dir, exist_ok=True)

    # Ensure X_train is properly prepared for SHAP
    X_train = X_train[feature_names]

    # Create a DataFrame for SHAP
    input_df = pd.DataFrame(input_data, columns=feature_names)

    # Calculate SHAP values using KernelExplainer
    try:
        explainer = shap.KernelExplainer(model.predict, X_train.sample(100))
        shap_values = explainer.shap_values(input_df)
    except Exception as e:
        print("Error calculating SHAP values:", e)
        raise

    print("SHAP values:")
    print(shap_values)

    risk_factors = dict(zip(feature_names, input_data[0]))

    # Plot the SHAP summary plot
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, input_df, show=False)
    shap_plot_filename = 'shap_summary_plot.png'
    plot_path = os.path.join(output_dir, shap_plot_filename)
    plt.savefig(plot_path, bbox_inches='tight')
    plt.close()
    print(f"SHAP summary plot saved at: {plot_path}")

    return status[0], f'/static/assets/img/{shap_plot_filename}', risk_factors

def generate_recommendations(risk_factors):
    recommendations = []
    if risk_factors['DiabetesMellitus'] == 1:
        recommendations.append(''' Limit Carbohydrate intake and Perform Regular monitoring of blood sugar levels''')
    if risk_factors['Hypertension'] == 1:
        recommendations.append('''Start blood pressure lowering medications if not currently taking,
                                or add BP med(s) to patient's existing regime''')
    if risk_factors['Current Smoker'] == 1:
        recommendations.append(''' Facilitate tobacco cessation to the patient''')
    if risk_factors['Obesity'] == 1:
        recommendations.append(''' Adress comprehensive lifestyle interventions to the patient including calorie
                               restriction  for achieving and maintaining weight loss.''')
    return recommendations


