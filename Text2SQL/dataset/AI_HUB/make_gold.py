import json


def make_gold_sql(json_file, output):
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    queries = []
    
    for item in data:
        queries.append(f"{item['query']} {item['db_id']}")

    # .sql 파일로 저장
    with open(output, 'w', encoding='utf-8') as f:
        for query in queries:
            f.write(query + "\n")


train = "./train.json"
test="./dev.json"
output_train_gold = "./train_gold.sql"
output_test_gold = "./dev_gold.sql"

#make_gold_sql(train, output_train_gold)
make_gold_sql(test,output_test_gold)