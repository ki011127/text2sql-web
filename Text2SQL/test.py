import json
import pandas as pd

# JSON 데이터가 파일에 저장되어 있다고 가정하고, 파일을 불러옴
file_path = "dataset/AI_HUB/tables.json"  # 적절한 파일 경로로 대체
db_id_to_find = "publicdata_climate_13048"

table_prompt_input = "/* Here are table name mapping information about database table name: */\n"

# JSON 파일 로드
with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# 해당 db_id에 해당하는 오브젝트 찾기
matching_object = next((obj for obj in data if obj["db_id"] == db_id_to_find), None)
db_info=""
if matching_object:
    # 테이블 이름 매핑
    table_names_original = matching_object["table_names_original"]
    table_names = matching_object["table_names"]

    # 테이블 매핑 데이터 생성
    table_mapping_data = [
        {"original": original, "translated": translated}
        for original, translated in zip(table_names_original, table_names)
    ]

    # 컬럼 이름 매핑
    column_names_original = matching_object["column_names_original"]
    column_names = matching_object["column_names"]

    # "*" 제외한 컬럼 매핑 생성
    filtered_data = [
        {
            "table_id": original[0],
            "original": original[1],
            "translated": translated[1],
        }
        for original, translated in zip(column_names_original, column_names)
        if original[1] != "*" and translated[1] != "*"
    ]

    # 컬럼 매핑 데이터를 테이블별로 그룹화
    grouped_columns = {}
    for column in filtered_data:
        table_id = column["table_id"]
        if table_id not in grouped_columns:
            grouped_columns[table_id] = []
        grouped_columns[table_id].append(column)

    # 프롬프트 생성
    for mapping in table_mapping_data:
        table_prompt_input += f"- actual_table_name: {mapping['original']}, original_table_name: {mapping['translated']}\n"
    table_prompt_input += "/* When you answer the following question you must use actual_table_name for table name*/\n"
    
    column_prompt_input = "/*Here are column mapping information about database column name: */"
    for table_id, columns in grouped_columns.items():
        table_name_original = table_names_original[table_id]
        column_prompt_input += f"\nTable: {table_name_original}\n"
        for column in columns:
            column_prompt_input += f"- actual_column_name: {column['original']}, original_name: {column['translated']}\n"
    column_prompt_input += "/* When you answer the following question you must use actual_column_name for column name*/\n"
    # 최종 프롬프트
    db_info = f"{table_prompt_input}\n{column_prompt_input}"

    print(db_info)