import json
from models import db, User, JobRole

DEFAULT_ROLES = [
    {
        "title": "Python Developer",
        "category": "Technical",
        "description": "Core Python, Object-Oriented Programming, Data Structures, Web Frameworks (Django/Flask), Async IO, and DB optimization.",
        "sample_topics": "Decorators, Generators, GIL, Memory Management, REST APIs, Virtual Environments, List Comprehensions"
    },
    {
        "title": "Frontend Web Developer",
        "category": "Technical",
        "description": "Modern UI development using HTML5, CSS3, JavaScript (ES6+), React/Vue, state management, web performance, and responsive design.",
        "sample_topics": "Virtual DOM, Promises, Closure, Flexbox/Grid, CSS Modules, Performance, Component Lifecycle"
    },
    {
        "title": "Full Stack Engineer",
        "category": "Technical",
        "description": "End-to-end web system architecture combining modern frontend frameworks, REST/GraphQL backend APIs, database design, and auth.",
        "sample_topics": "REST Architecture, JWT Authentication, Microservices, Relational DBs, Frontend State, CI/CD"
    },
    {
        "title": "Data Analyst",
        "category": "Technical",
        "description": "Data manipulation, SQL querying, statistical data analysis, visualization tools, Python (Pandas, NumPy), and business insights.",
        "sample_topics": "SQL Joins, Aggregation, Pandas DataFrames, Data Cleaning, A/B Testing, Visualization, Hypothesis Testing"
    },
    {
        "title": "HR & Behavioral Specialist",
        "category": "HR",
        "description": "Behavioral competencies, teamwork, conflict resolution, situational judgment, leadership, and communication skills.",
        "sample_topics": "STAR Method, Team Conflicts, Problem Solving, Work Under Pressure, Career Goals, Leadership"
    },
    {
        "title": "DevOps & Cloud Engineer",
        "category": "Technical",
        "description": "Cloud infrastructure (AWS/Azure/GCP), containerization (Docker, Kubernetes), CI/CD pipelines, and server monitoring.",
        "sample_topics": "Docker Containers, Kubernetes Deployments, CI/CD Pipelines, Infrastructure as Code, Linux Administration"
    }
]

QUESTION_BANK = {
    "Python Developer": [
        {
            "question_text": "Explain the difference between deep copy and shallow copy in Python, and provide a scenario where you would use each.",
            "category": "Python Core",
            "difficulty": "Medium",
            "expected_keywords": "copy module, shallow copy, deep copy, references, nested objects",
            "sample_answer": "A shallow copy constructs a new object and populates it with references to the child objects found in the original. A deep copy constructs a new object and recursively inserts copies of the child objects. Use shallow copy for flat objects; deep copy for nested lists or dicts to avoid unexpected side effects."
        },
        {
            "question_text": "How do Python decorators work under the hood? Give an example of how you would write a custom timer decorator.",
            "category": "Python Advanced",
            "difficulty": "Medium",
            "expected_keywords": "higher-order functions, wrappers, functools.wraps, callables, closure",
            "sample_answer": "Decorators are functions that accept another function as an argument and return a modified function closure. Using functools.wraps preserves function metadata. A timer decorator measures execution time using time.time() before and after calling the function."
        },
        {
            "question_text": "What is the Global Interpreter Lock (GIL) in Python, and how does it impact multithreading vs multiprocessing?",
            "category": "Concurrency",
            "difficulty": "Hard",
            "expected_keywords": "GIL, CPython, thread lock, CPU-bound, I/O-bound, multiprocessing",
            "sample_answer": "The GIL is a mutex that prevents multiple native threads from executing Python bytecode simultaneously in CPython. Multithreading helps for I/O-bound tasks, while multiprocessing bypasses the GIL for CPU-bound performance."
        },
        {
            "question_text": "How does memory management and garbage collection work in CPython?",
            "category": "Python Core",
            "difficulty": "Hard",
            "expected_keywords": "reference counting, cyclic garbage collector, generations, ref count",
            "sample_answer": "CPython uses reference counting as its primary mechanism. When reference count drops to zero, memory is freed immediately. A generational garbage collector handles reference cycles."
        },
        {
            "question_text": "What is the difference between generator expressions and list comprehensions in terms of memory usage?",
            "category": "Python Core",
            "difficulty": "Easy",
            "expected_keywords": "yield, lazy evaluation, iterator, memory efficiency, square brackets vs parentheses",
            "sample_answer": "List comprehensions create the entire list in memory at once, while generators evaluate lazily and yield elements one by one, keeping memory footprint minimal."
        }
    ],
    "Frontend Web Developer": [
        {
            "question_text": "Explain how the Virtual DOM works in React and how reconciliation improves rendering performance.",
            "category": "React Framework",
            "difficulty": "Medium",
            "expected_keywords": "Virtual DOM, Diffing algorithm, reconciliation, state update, re-rendering",
            "sample_answer": "The Virtual DOM is an in-memory representation of real DOM elements. When state changes, React creates a new VDOM tree, diffs it with the previous tree, and updates only changed nodes in the real DOM."
        },
        {
            "question_text": "What are JavaScript closures, and how can they lead to memory leaks if not handled carefully?",
            "category": "JavaScript Core",
            "difficulty": "Medium",
            "expected_keywords": "lexical environment, outer function scope, retain memory, event listener cleanup",
            "sample_answer": "A closure is a function bound together with references to its surrounding state (lexical environment). If closures hold references to large objects or unremoved event listeners, memory cannot be garbage collected."
        },
        {
            "question_text": "Describe the Event Loop in JavaScript including Call Stack, Microtask Queue, and Macrotask Queue.",
            "category": "JavaScript Core",
            "difficulty": "Hard",
            "expected_keywords": "call stack, event loop, Promise.then, setTimeout, microtasks, macrotasks",
            "sample_answer": "The Event Loop continuously monitors the call stack and task queues. Synchronous code executes on the call stack first. Once clear, all microtasks (Promises, process.nextTick) are processed before taking one macrotask (setTimeout, setInterval)."
        },
        {
            "question_text": "What strategies do you use to optimize web page performance and speed up initial page load times?",
            "category": "Web Performance",
            "difficulty": "Medium",
            "expected_keywords": "code splitting, lazy loading, compression, CDN, image optimization, minification",
            "sample_answer": "Optimization includes code splitting using React.lazy, minifying assets, serving images in WebP format with lazy loading, using browser caching, CDN delivery, and removing unused CSS/JS."
        },
        {
            "question_text": "What is the difference between `localStorage`, `sessionStorage`, and `cookies`?",
            "category": "Browser Storage",
            "difficulty": "Easy",
            "expected_keywords": "persistent storage, session length, cookie headers, capacity limits, HTTP requests",
            "sample_answer": "localStorage persists across browser sessions (~5MB limit). sessionStorage clears when the browser tab closes. Cookies are small data chunks (~4KB) sent automatically with HTTP requests."
        }
    ],
    "Full Stack Engineer": [
        {
            "question_text": "Walk me through how JWT (JSON Web Tokens) work for stateless user authentication in a Web API.",
            "category": "Security & Auth",
            "difficulty": "Medium",
            "expected_keywords": "Header, Payload, Signature, secret key, Bearer token, stateless",
            "sample_answer": "JWT consists of Header, Payload, and Signature. The server signs the token using a secret key upon successful login. The client sends it in the Authorization Bearer header. The server verifies signature without checking database."
        },
        {
            "question_text": "How do you handle relational database migration and schema updates in a zero-downtime production deployment?",
            "category": "Databases & Architecture",
            "difficulty": "Hard",
            "expected_keywords": "migrations, backward compatibility, expand and contract, blue-green deployment",
            "sample_answer": "Use the expand-contract pattern: first add new columns or tables as optional, deploy updated application code that handles both old and new schema, then migrate data and remove legacy columns in a subsequent release."
        },
        {
            "question_text": "What is CORS (Cross-Origin Resource Sharing), and how do you resolve CORS errors between frontend and backend?",
            "category": "Web Protocols",
            "difficulty": "Easy",
            "expected_keywords": "origin headers, preflight request, Access-Control-Allow-Origin, HTTP OPTIONS",
            "sample_answer": "CORS is a security mechanism enforced by browsers. Resolving it requires configuring backend headers (e.g. Access-Control-Allow-Origin) or using a reverse proxy/dev server proxy during development."
        }
    ],
    "HR & Behavioral Specialist": [
        {
            "question_text": "Tell me about a time you faced a major conflict within your project team. How did you handle it using the STAR method?",
            "category": "Behavioral",
            "difficulty": "Medium",
            "expected_keywords": "Situation, Task, Action, Result, communication, compromise, resolution",
            "sample_answer": "Describe a specific Situation, state your Task, explain the proactive Actions taken (active listening, private 1-on-1 discussion, finding common ground), and highlight the successful Result."
        },
        {
            "question_text": "How do you prioritize tasks when assigned multiple urgent deadlines simultaneously?",
            "category": "Workplace Efficiency",
            "difficulty": "Easy",
            "expected_keywords": "Eisenhower matrix, communication, stakeholder expectation, delegation, breakdown",
            "sample_answer": "Assess business impact and urgency, communicate transparently with team leads, renegotiate non-critical deadlines, and break tasks down into manageable daily milestones."
        },
        {
            "question_text": "Describe a situation where a technical project you were working on failed or missed its target. What did you learn?",
            "category": "Resilience & Ownership",
            "difficulty": "Medium",
            "expected_keywords": "ownership, post-mortem, retrospective, continuous improvement, lessons learned",
            "sample_answer": "Take ownership without blaming others, explain the root cause (e.g., unexpected scope creep or scope estimation error), and highlight actionable adjustments instituted in future projects."
        }
    ],
    "Data Analyst": [
        {
            "question_text": "Explain the difference between `WHERE` and `HAVING` clauses in SQL, and when each is evaluated.",
            "category": "SQL Queries",
            "difficulty": "Easy",
            "expected_keywords": "aggregation, GROUP BY, filtering before vs after, WHERE vs HAVING",
            "sample_answer": "`WHERE` filters individual rows before aggregation occurs. `HAVING` filters aggregated groups after `GROUP BY` is applied."
        },
        {
            "question_text": "How do you handle missing or corrupted data in a large dataset before performing statistical analysis?",
            "category": "Data Cleaning",
            "difficulty": "Medium",
            "expected_keywords": "imputation, mean/median fill, drop nulls, outlier detection, domain context",
            "sample_answer": "First check missingness patterns (MCAR, MAR, MNAR). Apply appropriate strategy: dropping rows if minimal, mean/median/mode imputation for continuous/categorical columns, or using model-based imputation."
        }
    ],
    "DevOps & Cloud Engineer": [
        {
            "question_text": "Explain the difference between Docker containers and Virtual Machines (VMs) in terms of isolation and resource consumption.",
            "category": "Cloud & DevOps",
            "difficulty": "Medium",
            "expected_keywords": "shared kernel, hypervisor, guest OS, light-weight, startup time",
            "sample_answer": "VMs run a full guest OS on top of a hypervisor with dedicated virtualized hardware. Containers share the host OS kernel, making them significantly lighter, faster to boot, and more resource-efficient."
        }
    ]
}

def seed_database():
    """Seeds the database with default job roles and demo user if empty."""
    # Seed Demo User
    demo_user = User.query.filter_by(email="demo@candidate.com").first()
    if not demo_user:
        demo_user = User(name="Demo Candidate", email="demo@candidate.com")
        demo_user.set_password("demo123")
        db.session.add(demo_user)
        db.session.commit()
        print("[SEED] Created Demo Candidate user: demo@candidate.com / demo123")

    # Seed Job Roles
    for role_data in DEFAULT_ROLES:
        existing_role = JobRole.query.filter_by(title=role_data["title"]).first()
        if not existing_role:
            role = JobRole(
                title=role_data["title"],
                category=role_data["category"],
                description=role_data["description"],
                sample_topics=role_data["sample_topics"]
            )
            db.session.add(role)
    db.session.commit()
    print("[SEED] Job roles seeded successfully.")
