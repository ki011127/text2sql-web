import random
import json

input_file_path = "dev_original.json"
output_file_path = "dev.json"

with open(input_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

subset_data = random.sample(data, 1034)


with open(output_file_path, 'w', encoding='utf-8') as file:
    json.dump(subset_data, file, ensure_ascii=False, indent=4)
