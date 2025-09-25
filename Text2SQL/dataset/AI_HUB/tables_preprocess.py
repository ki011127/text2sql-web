import os
import json

def get_all_files(root_dir):
    print(root_dir)
    all_files = []
    for file in os.listdir(root_dir):
        
        file_path = os.path.join(root_dir, file)
        all_files.append(file_path)
    return all_files

def merge_data(files):
    merged_data = []
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = json.load(f)
            if "data" in content:
                merged_data.extend(content["data"])
    return merged_data



tables_dir = "./tables"
tables_files = get_all_files(tables_dir)

for file in tables_files:
    print(file)


merged_tables_data = merge_data(tables_files)

output_path = "./tables.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(merged_tables_data, f, indent=4, ensure_ascii=False)