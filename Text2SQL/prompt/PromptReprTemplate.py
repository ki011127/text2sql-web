from utils.utils import get_sql_for_database
import json
import sqlite3
import pandas as pd
class BasicPrompt(object):
    def __init__(self, *args, **kwargs):
        # used to avoid empty init function in 0-shot prompt
        pass

    def format_target(self, example: dict):
        return self.format_question(example) + "\nSELECT "

    def format_question(self, example: dict):
        raise NotImplementedError()

    def get_extra_info(self, db_id):
        return None


class SQLPrompt(BasicPrompt):
    template_info =   "/* Given the following database schema: */\n" \
                      "{}"
    template_question =  "/* Answer the following: {} */"
    template_data = "/* Here are some data information about database references: */\n {}"
    def format_question(self, example: dict):
        
        sqls = get_sql_for_database(example["path_db"])

        prompt_info = self.template_info.format("\n\n".join(sqls))


        table_prompt_input = "/* Here are table name mapping information about database table name: */\n"
        file_path = "dataset/AI_HUB/tables.json"  

        # JSON 파일 로드
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 해당 db_id에 해당하는 오브젝트 찾기
        matching_object = next((obj for obj in data if obj["db_id"] == example['db_id']), None)
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








        # file_path = "dataset/AI_HUB/tables.json"
        # db_info = "/*Here are column mapping information about database column name: */\n"
        # with open(file_path, "r", encoding="utf-8") as f:
        #     data = json.load(f)


        # matching_object = next((obj for obj in data if obj["db_id"] == example['db_id']), None)

        # if matching_object:
        #     column_names_original = matching_object["column_names_original"]
        #     column_names = matching_object["column_names"]
            
        #     filtered_data = [
        #         {"original": original[1], "translated": translated[1]}
        #         for original, translated in zip(column_names_original, column_names)
        #         if original[1] != "*" and translated[1] != "*"
        #     ]

        #     result_df = pd.DataFrame(filtered_data)
            
        #     # 결과 출력
        #     for row in filtered_data:
        #         db_info += f"- actual_column_name: {row['original']}, original_name: {row['translated']}\n"
        # db_info+="/* When you answer the following question you must use actual_column_name for column name*/\n"


        # db = example['path_db']

        # simplified_ddl_data = []

        # mydb = sqlite3.connect(db)
        # cur = mydb.cursor()
        # cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        # Tables = cur.fetchall()
        # for table in Tables:
        #     cur.execute(f"select * from `{table[0]}`")
        #     col_name_list = [tuple[0] for tuple in cur.description]
        #     db_data_all = []
        #     for i in range(3):
        #         db_data_all.append(cur.fetchone())
        #     test = ""
        #     for idx, column_data in enumerate(col_name_list):
        #         # print(list(db_data_all[2])[idx])
        #         try:
        #             test += f"{column_data}[{list(db_data_all[0])[idx]},{list(db_data_all[1])[idx]},{list(db_data_all[2])[idx]}],"
        #         except:
        #             test = test
        #     if len(test)>=20000:
        #         # ddls_data
        #         test = ""
        #         for idx, column_data in enumerate(col_name_list):
        #             try:
        #                 test += f"{column_data}[{list(db_data_all[0])[idx]},{list(db_data_all[1])[idx]}],"
        #             except:
        #                 test = test
        #     if len(test)>=20000:
        #         # ddls_data
        #         test = ""
        #         for idx, column_data in enumerate(col_name_list):
        #             try:
        #                 test += f"{column_data}[{list(db_data_all[0])[idx]}],"
        #             except:
        #                 test = test
        #     simplified_ddl_data.append(f"{table[0]}({test[:-1]})")
        # ddls_data = "# " + ";\n# ".join(simplified_ddl_data) + ";\n"

        # db_info = self.template_data.format(ddls_data)
        #db_info = "/* This is a column name inference method. */\nThe column name of the schema may be a combination of pronunciation of Korean according to sound and English abbreviations. Considering this factor, select the correct column and make a sql statement.\n"
        #db_info = "/*The column name of the schema may be a combination of pronunciation of Korean according to sound and English abbreviations.*/\n"
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])
        # print("db_info: " + db_info)
        
        if prompt_extra_info is None or prompt_extra_info == "":
            #prompt_components = [prompt_info, prompt_question]
            prompt_components = [prompt_info, db_info, prompt_question]
        else:
            prompt_components = [prompt_info, db_info, prompt_extra_info, prompt_question]
            #prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n\n".join(prompt_components)
        print("prompt: " + prompt)
        return prompt


class TextPrompt(BasicPrompt):
    template_info = "Given the following database schema:\n" \
                  "{}"
    template_question = "Answer the following: {}"

    def format_question(self, example: dict):
        schemas = "\n".join([f"{_.name}: {', '.join(_.schema)}" for _ in example["tables"]])

        prompt_info = self.template_info.format(schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt


class NumberSignPrompt(BasicPrompt):
    template_info = "### Complete sqlite SQL query only and with no explanation\n" \
                    "### SQLite SQL tables, with their properties:\n" \
                    "#\n" \
                    "{}\n" \
                    "#"
    template_question = "### {}"

    def format_question(self, example: dict):
        schemas = "\n".join([f"# {_.name}({', '.join(_.schema)})" for _ in example["tables"]])

        prompt_info = self.template_info.format(schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt


class BaselinePrompt(BasicPrompt):
    template_info = "{}\nForeign_keys={}\n"
    template_question = "Q: \"{}\""

    def format_question(self, example: dict):
        # schemas
        schemas = "\n".join([f"Table {_.name}, columns = {_.schema}" for _ in example["tables"]]).replace("'", "")
        # foreign_keys
        foreign_keys = list()
        for table in example["tables"]:
            for pair_str in table["table_info"]["foreign_key"]:
                a, b = [_.strip() for _ in pair_str[1:-1].split(",")]
                foreign_keys.append(f"{a}={b}")

        # format prompt
        prompt_info = self.template_info.format(schemas, str(foreign_keys).replace("'", ""))
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "".join(prompt_components)
        return prompt

    def format_target(self, example: dict):
        return self.format_question(example) + "\nA: SELECT "


class InstructionPrompt(BasicPrompt):
    template_info = (
        "Below is an instruction that describes a task, paired with an input that provides further context. "
        "Write a response that appropriately completes the request.\n\n"
        "### Instruction:\nWrite a sql to answer the question \"{}\"\n\n### Input:\n{}\n"
    )
    template_question = "### Response:"

    def format_question(self, example: dict):
        schemas = "\n".join([f"{_.name}({', '.join(_.schema)})" for _ in example["tables"]])

        prompt_info = self.template_info.format(example["question"], schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info, prompt_question]
        else:
            # TODO: extra_info should be after info
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt


class TextWithForeignKeyPrompt(BasicPrompt):
    template_info = "Given the following database schema:\n" \
                    "{} \n" \
                    "And their foreign keys:\n" \
                    "{}"
    template_question = "Answer the following: {}"

    def format_question(self, example: dict):
        schemas = "\n".join([f"{_.name}: {', '.join(_.schema)}" for _ in example["tables"]])
        # foreign_keys
        foreign_keys = list()
        for table in example["tables"]:
            for pair_str in table["table_info"]["foreign_key"]:
                a, b = [_.strip() for _ in pair_str[1:-1].split(",")]
                foreign_keys.append(f"{a}={b}")
        foreign_keys = f"{', '.join(foreign_keys)}"

        prompt_info = self.template_info.format(schemas, foreign_keys)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt


class NumberSignWithForeignKeyPrompt(BasicPrompt):
    template_info = "### Complete sqlite SQL query only and with no explanation\n" \
                    "### SQLite SQL tables, with their properties:\n" \
                    "#\n" \
                    "{}\n" \
                    "#\n" \
                    "### Their foreign keys:\n" \
                    "#\n" \
                    "{}\n" \
                    "#"
    template_question = "### {}"

    def format_question(self, example: dict):
        schemas = "\n".join([f"# {_.name}({', '.join(_.schema)})" for _ in example["tables"]])
        # foreign_keys
        foreign_keys = list()
        for table in example["tables"]:
            for pair_str in table["table_info"]["foreign_key"]:
                a, b = [_.strip() for _ in pair_str[1:-1].split(",")]
                foreign_keys.append(f"{a}={b}")
        foreign_keys = f"# Foreign_keys=({', '.join(foreign_keys)})"

        prompt_info = self.template_info.format(schemas, foreign_keys)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info, prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt


class BaselineWithoutForeignKeyPrompt(BasicPrompt):
    template_info = "{}\n"
    template_question = "Q: \"{}\""

    def format_question(self, example: dict):
        # schemas
        schemas = "\n".join([f"Table {_.name}, columns = {_.schema}" for _ in example["tables"]]).replace("'", "")

        # format prompt
        prompt_info = self.template_info.format(schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "".join(prompt_components)
        return prompt

    def format_target(self, example: dict):
        return self.format_question(example) + "\nA: SELECT "


class InstructionWithForeignKeyPrompt(BasicPrompt):
    template_info = (
        "Below is an instruction that describes a task, paired with an input that provides further context. "
        "Write a response that appropriately completes the request.\n\n"
        "### Instruction:\nWrite a sql to answer the question \"{}\"\n\n### Input:\n{}\nForeign Keys:{}\n"
    )
    template_question = "### Response:"

    def format_question(self, example: dict):
        schemas = "\n".join([f"{_.name}({', '.join(_.schema)})" for _ in example["tables"]])
        # foreign_keys
        foreign_keys = list()
        for table in example["tables"]:
            for pair_str in table["table_info"]["foreign_key"]:
                a, b = [_.strip() for _ in pair_str[1:-1].split(",")]
                foreign_keys.append(f"{a}={b}")
        foreign_keys = f"{', '.join(foreign_keys)}"

        prompt_info = self.template_info.format(example["question"], schemas, foreign_keys)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info, prompt_question]
        else:
            # TODO: extra_info should be after info
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt


class SQLWithRulePrompt(BasicPrompt):
    template_info =   "/* Given the following database schema: */\n" \
                      "{}"
    template_question =  "/* Answer the following with no explanation: {} */"

    def format_question(self, example: dict):
        sqls = get_sql_for_database(example["path_db"])

        prompt_info = self.template_info.format("\n\n".join(sqls))
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info, prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n\n".join(prompt_components)
        return prompt


class TextWithRulePrompt(BasicPrompt):
    template_info = "Given the following database schema:\n" \
                  "{}"
    template_question = "Answer the following with no explanation: {}"

    def format_question(self, example: dict):
        schemas = "\n".join([f"{_.name}: {', '.join(_.schema)}" for _ in example["tables"]])

        prompt_info = self.template_info.format(schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt


class NumberSignWithoutRulePrompt(BasicPrompt):
    template_info = "### Complete sqlite SQL query\n" \
                    "### SQLite SQL tables, with their properties:\n" \
                    "#\n" \
                    "{}\n" \
                    "#"
    template_question = "### {}"

    def format_question(self, example: dict):
        schemas = "\n".join([f"# {_.name}({', '.join(_.schema)})" for _ in example["tables"]])

        prompt_info = self.template_info.format(schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt


class InstructionWithRulePrompt(BasicPrompt):
    template_info = (
        "Below is an instruction that describes a task, paired with an input that provides further context. "
        "Write a response that appropriately completes the request.\n\n"
        "### Instruction:\nWrite a sql only and with no explanation to answer the question \"{}\"\n\n### Input:\n{}\n"
    )
    template_question = "### Response:"

    def format_question(self, example: dict):
        schemas = "\n".join([f"{_.name}({', '.join(_.schema)})" for _ in example["tables"]])

        prompt_info = self.template_info.format(example["question"], schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info, prompt_question]
        else:
            # TODO: extra_info should be after info
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt


class SQLCOTPrompt(BasicPrompt):
    template_info =   "/* Given the following database schema: */\n" \
                      "{}"
    template_question =  "/* Let's think step by step. Answer the following: {} */"

    def format_question(self, example: dict):
        sqls = get_sql_for_database(example["path_db"])

        prompt_info = self.template_info.format("\n\n".join(sqls))
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info, prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n\n".join(prompt_components)
        return prompt

    def format_target(self, example: dict):
        return self.format_question(example)


class TextCOTPrompt(BasicPrompt):
    template_info = "Given the following database schema:\n" \
                  "{}"
    template_question = "Let's think step by step. Answer the following: {}"

    def format_question(self, example: dict):
        schemas = "\n".join([f"{_.name}: {', '.join(_.schema)}" for _ in example["tables"]])

        prompt_info = self.template_info.format(schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt

    def format_target(self, example: dict):
        return self.format_question(example)


class NumberSignCOTPrompt(BasicPrompt):
    template_info = "### Let's think step by step. Complete sqlite SQL query only and with no explanation\n" \
                    "### SQLite SQL tables, with their properties:\n" \
                    "#\n" \
                    "{}\n" \
                    "#"
    template_question = "### {}"

    def format_question(self, example: dict):
        schemas = "\n".join([f"# {_.name}({', '.join(_.schema)})" for _ in example["tables"]])

        prompt_info = self.template_info.format(schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt

    def format_target(self, example: dict):
        return self.format_question(example)


class InstructionCOTPrompt(BasicPrompt):
    template_info = (
        "Below is an instruction that describes a task, paired with an input that provides further context. "
        "Write a response that appropriately completes the request.\n\n"
        "### Instruction:\nLet's think step by step. Write a sql to answer the question \"{}\"\n\n### Input:\n{}\n"
    )
    template_question = "### Response:"

    def format_question(self, example: dict):
        schemas = "\n".join([f"{_.name}({', '.join(_.schema)})" for _ in example["tables"]])

        prompt_info = self.template_info.format(example["question"], schemas)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info, prompt_question]
        else:
            # TODO: extra_info should be after info
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt

    def format_target(self, example: dict):
        return self.format_question(example)


class CBRPrompt(BasicPrompt):
    template_info = "# The following are the table names and column names needed to generate SQL:\n" \
                    "Tables: {}\n" \
                    "Columns: *, {}\n" \
                    "Foreign keys: {}"
    template_question = '# translate "{}" into SQL query only and with no explanation:'

    def format_question(self, example: dict):
        tables = ", ".join([f"{_.name}" for _ in example["tables"]])
        columns = ", ".join([f"{_.name}.{col}" for _ in example["tables"] for col in _.schema])
        # foreign_keys
        foreign_keys = list()
        for table in example["tables"]:
            for pair_str in table["table_info"]["foreign_key"]:
                a, b = [_.strip() for _ in pair_str[1:-1].split(",")]
                foreign_keys.append(f"{a}={b}")
        foreign_keys = f"{', '.join(foreign_keys)}"

        prompt_info = self.template_info.format(tables, columns, foreign_keys)
        prompt_extra_info = self.get_extra_info(example["db_id"])
        prompt_question = self.template_question.format(example["question"])

        if prompt_extra_info is None or prompt_extra_info == "":
            prompt_components = [prompt_info,prompt_question]
        else:
            prompt_components = [prompt_info, prompt_extra_info, prompt_question]

        prompt = "\n".join(prompt_components)
        return prompt