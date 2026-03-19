-- // 用户表
-- // 存储系统用户信息，包括个人用户和企业用户和管理员用户 
CREATE TABLE user (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    email VARCHAR(255) UNIQUE COMMENT '邮箱，唯一',
    phone VARCHAR(20) UNIQUE COMMENT '手机号，唯一',
    username VARCHAR(100) NOT NULL COMMENT '用户名',
    flag TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户类型 0-个人用户 1-企业用户 2-管理员用户',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- // 实际数据库中存储的密码应该是哈希值，这里的测试数据用的是明文，可以忽略
INSERT INTO user(id, email, phone, username, flag, password_hash) 
VALUES 
(1, 'test@person', '111', 'person', 0, 'person'),
(2, 'test@company', '222', 'company', 1, 'company');

-- // 用户描述表
-- // 存储用户个人主页的相关信息 
CREATE TABLE describeuser (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    introduce TEXT NOT NULL COMMENT '对自己的介绍',
    address VARCHAR(255) NOT NULL COMMENT '住址',
    purpose_role VARCHAR(255) NOT NULL COMMENT '意向职位',
    contact VARCHAR(255) NOT NULL COMMENT '联系方式',
    
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO describeuser(user_id, introduce, address, purpose_role, contact) 
VALUES 
(3, 'none', 'none', 'none', 'none'),
(4, 'none', 'none', 'none', 'none');

-- // 职位表
-- // 存储企业用户发布的招聘职位信息
CREATE TABLE job (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '职位名称',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '发布用户ID（企业）',
    content TEXT NOT NULL COMMENT '职位描述，使用TEXT类型存储详细信息',
    status TINYINT UNSIGNED DEFAULT 1 COMMENT '状态 1-发布 0-草稿 2-隐藏',
    salary_min INT NOT NULL COMMENT '最低薪资' ,
	salary_max INT NOT NULL COMMENT '最高薪资' ,
	type TINYINT UNSIGNED DEFAULT 0 COMMENT '职位类型 0-全职 1-兼职 2-小时工 3-单次', 
	experience TINYINT UNSIGNED DEFAULT 0 COMMENT '经验要求，0-无要求 大于0-有要求',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO job (id, title, user_id, content, status, salary_min, salary_max, type, experience) 
VALUES 
('1', 'test_title', '1', 'test_content', '1', '1000', '5000', '0', '0');

-- // 新闻表
-- // 由管理员来发布
CREATE TABLE coverage  (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kernel VARCHAR(100) NOT NULL COMMENT '文章关键字',
    title VARCHAR(200) NOT NULL COMMENT '文章标题',
    author VARCHAR(100) NOT NULL COMMENT '文章发布者名称',
    content TEXT NOT NULL COMMENT '内容，使用TEXT类型存储详细信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_author (author),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO coverage (id, kernel, title, author, content) 
VALUES 
(1, 'test_kernel', 'test_title', 'test_author', 'test_content');

-- // 简历表
-- // 存储个人用户与企业用户的简历信息
CREATE TABLE resume (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '简历ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '所属用户ID（个人用户）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO resume(id, user_id) 
VALUES 
(1, 1);

-- // 标签表
-- // 存储用于分类的标签，用户和职位都需要标签标记
CREATE TABLE tag (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '标签ID',
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称，唯一'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci; 

INSERT INTO tag(id, name) 
VALUES 
(1, 'test_tag1'),
(2, 'test_tag2');

-- // 用户-标签关联表
-- // 实现用户与标签的多对多关系
CREATE TABLE user_tag (
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    tag_id BIGINT UNSIGNED NOT NULL COMMENT '标签ID',
    PRIMARY KEY (user_id, tag_id) COMMENT '联合主键，确保一个用户对同一个标签只关联一次',
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO user_tag(user_id, tag_id) 
VALUES 
(1, 1),
(2, 2);

-- // 职位-标签关联表
-- // 实现职位与标签的多对多关系，方便用户分类
CREATE TABLE job_tag (
    job_id BIGINT UNSIGNED NOT NULL COMMENT '职位ID',
    tag_id BIGINT UNSIGNED NOT NULL COMMENT '标签ID',
    PRIMARY KEY (job_id, tag_id) COMMENT '联合主键，确保一个职位对同一个标签只关联一次',
    FOREIGN KEY (job_id) REFERENCES job(id) ON DELETE CASCADE ON UPDATE CASCADE, 
    FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO job_tag(job_id, tag_id) 
VALUES 
(1, 1);

-- // 用户简历投递表
-- // 记录个人用户向职位投递简历的行为及企业用户对简历的审核状态
CREATE TABLE user_resume (
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID（仅个人用户）',
    resume_id BIGINT UNSIGNED NOT NULL COMMENT '简历ID',
    job_id BIGINT UNSIGNED NOT NULL COMMENT '职位ID',
    pass TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '审核状态 0-未审核 1-通过 2-不通过',
    PRIMARY KEY (user_id, resume_id) COMMENT '联合主键，确保同一份简历不重复投递',
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resume(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job (id) ON DELETE CASCADE ON UPDATE CASCADE 
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO user_resume(user_id, resume_id, job_id, pass) 
VALUES 
(1, 1, 1, 0);

-- //面试具体信息表 
-- //企业用户在创建一个职位后，还需要创建该职位对应的面试要求，简历通过的个人用户可以看到面试详细信息 
CREATE TABLE interview (
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID（这里指的是企业用户）',
    job_id BIGINT UNSIGNED NOT NULL COMMENT '职位ID',
    interview_where VARCHAR(100) NOT NULL COMMENT '面试的地点',
    interview_when VARCHAR(200) NOT NULL COMMENT '面试的时间',
    interview_remark TEXT NOT NULL COMMENT '面试要求的备注',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, job_id) COMMENT '联合主键，确保同一份职位不会有重复的面试要求',
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job(id) ON DELETE CASCADE ON UPDATE CASCADE 
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO interview(user_id, job_id, interview_where, interview_when, interview_remark) 
VALUES 
(1, 1,'J1-1108', 'PM6:00', 'none');
